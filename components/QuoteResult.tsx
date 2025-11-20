
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { QuoteData, QuoteStep, Currency, UserSettings, TechnicalReportData } from '../types';
import { CheckCircleIcon, PencilIcon, DownloadIcon, TrashIcon, PlusIcon, SparklesIcon } from './AppIcons';
import { generateTechnicalReport, analyzeImageForReport, generateSingleQuoteStep } from '../services/geminiService';
import { TechnicalReport } from './TechnicalReport';

// Make jspdf and html2canvas available in the scope
declare const jspdf: any;
declare const html2canvas: any;

interface QuoteResultProps {
  quote: QuoteData;
  userSettings: UserSettings;
  images: File[]; // Received from App
  onReset: () => void;
  onSaveOrUpdate: (finalQuote: QuoteData) => void; // Manual Save/Close
  onAutoSave: (updatedQuote: QuoteData) => void; // Background Auto-Save
  isViewingSaved: boolean;
  onReportGenerated?: (report: TechnicalReportData) => void; // Callback for when report is created
  onReportUpdate?: (report: TechnicalReportData) => void; // Callback for updating report
}

const formatCurrency = (value: number, currency: Currency) => {
    const locales: Record<Currency, string> = {
        'BRL': 'pt-BR',
        'USD': 'en-US',
        'EUR': 'pt-PT'
    };
    return (value || 0).toLocaleString(locales[currency], { style: 'currency', currency });
};

// Component for editable fields
const EditableField: React.FC<{label: string, value: string, onChange: (value: string) => void, placeholder?: string, large?: boolean}> = ({ label, value, onChange, placeholder, large = false }) => (
    <div>
        <label className="block text-sm font-bold text-gray-500 uppercase mb-1">{label}</label>
        {large ? (
            <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-900 text-base" rows={3}></textarea>
        ) : (
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-900 text-base" />
        )}
    </div>
);

// Inline Editable Input for Headers (Ref. Processo)
const EditableHeaderInput: React.FC<{value: string, onChange: (val: string) => void, isPrinting: boolean, className?: string, placeholder?: string}> = ({ value, onChange, isPrinting, className = '', placeholder = '' }) => {
    if (isPrinting) return <span className={className}>{value}</span>;
    return (
        <input 
            type="text" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className={`bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none transition-colors ${className}`}
            placeholder={placeholder}
        />
    )
}

export const QuoteResult: React.FC<QuoteResultProps> = ({ quote, userSettings, images, onReset, onSaveOrUpdate, onAutoSave, isViewingSaved, onReportGenerated, onReportUpdate }) => {
  const [editedQuote, setEditedQuote] = useState<QuoteData>(() => {
      const initialQuote = JSON.parse(JSON.stringify(quote));
      // Ensure all steps have IDs for React Keys immediately on mount
      initialQuote.steps = initialQuote.steps.map((step: any) => ({
          ...step,
          id: step.id || `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      return initialQuote;
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [viewMode, setViewMode] = useState<'quote' | 'report'>('quote');
  const [reportData, setReportData] = useState<TechnicalReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  
  // Local state for editable labels in the totals section
  const [totalLabels, setTotalLabels] = useState({
      subtotal: 'Subtotal',
      tax: 'Impostos (IVA)',
      total: 'Total Geral'
  });
  
  // Confirmation state for deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // State to manage images locally (allowing additions/removals)
  const [managedFiles, setManagedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // State for adding new steps
  const [newStepDescription, setNewStepDescription] = useState('');
  const [isAddingStep, setIsAddingStep] = useState(false);
  
  const pdfRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Initialize managedFiles from props on mount
  useEffect(() => {
    if (images && images.length > 0) {
        setManagedFiles(images);
    }
  }, [images]);

  // Update previews whenever managedFiles changes
  useEffect(() => {
    const previews = managedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => {
        previews.forEach(url => URL.revokeObjectURL(url));
    }
  }, [managedFiles]);

  // AUTO-SAVE QUOTE
  useEffect(() => {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
          onAutoSave(editedQuote);
          setSaveStatus('saved');
      }, 1000); // Debounce 1s
      return () => clearTimeout(timer);
  }, [editedQuote, onAutoSave]);

  // AUTO-SAVE REPORT (Logic similar to quote)
  useEffect(() => {
      if (reportData && onReportUpdate && viewMode === 'report') {
          setSaveStatus('saving');
          const timer = setTimeout(() => {
              onReportUpdate(reportData);
              setSaveStatus('saved');
          }, 1000);
          return () => clearTimeout(timer);
      }
  }, [reportData, onReportUpdate, viewMode]);

  const handleAddImage = (file: File) => {
      setManagedFiles(prev => [...prev, file]);
  };

  const handleRemoveImage = (index: number) => {
      setManagedFiles(prev => prev.filter((_, i) => i !== index));
      if (reportData) {
          const newPhotoAnalysis = reportData.photoAnalysis.filter(p => p.photoIndex !== index)
            .map(p => ({...p, photoIndex: p.photoIndex > index ? p.photoIndex - 1 : p.photoIndex}));
          setReportData({...reportData, photoAnalysis: newPhotoAnalysis});
      }
  };
  
  const handleAutoDescribeImage = async (index: number) => {
      const file = managedFiles[index];
      if (!file) return;
      try {
          const analysis = await analyzeImageForReport(file);
          return analysis;
      } catch (e) {
          console.error("Error describing image", e);
          return null;
      }
  };

  const handlePriceChange = (index: number, value: string) => {
    const newPrice = Number(value);
    if (!isNaN(newPrice)) {
      const newSteps = [...editedQuote.steps];
      newSteps[index] = { ...newSteps[index], userPrice: newPrice };
      setEditedQuote(prev => ({ ...prev, steps: newSteps }));
    }
  };
  
  const handleQuantityChange = (index: number, value: string) => {
    const newQuantity = Number(value);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      const newSteps = [...editedQuote.steps];
      newSteps[index] = { ...newSteps[index], quantity: newQuantity };
      setEditedQuote(prev => ({ ...prev, steps: newSteps }));
    }
  };

  const handleTaxChange = (index: number, value: string) => {
    const newTaxRate = Number(value);
    if (!isNaN(newTaxRate)) {
        const newSteps = [...editedQuote.steps];
        newSteps[index] = { ...newSteps[index], taxRate: newTaxRate };
        setEditedQuote(prev => ({ ...prev, steps: newSteps }));
    }
  };

  const handleDescriptionChange = (index: number, value: string) => {
      const newSteps = [...editedQuote.steps];
      newSteps[index] = { ...newSteps[index], description: value };
      setEditedQuote(prev => ({ ...prev, steps: newSteps }));
  };
  
  const handleTitleChange = (index: number, value: string) => {
    const newSteps = [...editedQuote.steps];
    newSteps[index].title = value;
    setEditedQuote(prev => ({ ...prev, steps: newSteps }));
  };

  const handleClientDataChange = (field: keyof QuoteData, value: string) => {
    setEditedQuote(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteStep = (index: number) => {
      try {
        setEditedQuote(prev => {
            const newSteps = prev.steps.filter((_, i) => i !== index);
            const updated = { ...prev, steps: newSteps };
            try { onAutoSave(updated); } catch (e) {}
            return updated;
        });
      } catch (error) {
        console.error(error);
      }
  };

  const handleAddStepWithAI = async () => {
      if (!newStepDescription.trim()) return;
      setIsAddingStep(true);
      try {
          const newStep = await generateSingleQuoteStep(newStepDescription, editedQuote.city, editedQuote.currency);
          setEditedQuote(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
          setNewStepDescription('');
      } catch (error) {
          console.error(error);
          alert("Não foi possível gerar a etapa. Tente novamente.");
      } finally {
          setIsAddingStep(false);
      }
  };
  
  const handleSave = () => {
    onSaveOrUpdate(editedQuote);
  };

  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      try {
          const data = await generateTechnicalReport(editedQuote, managedFiles, userSettings.companyName, editedQuote.code);
          
          // Assign ID immediately so it's trackable by AutoSave
          const reportWithId = { 
              ...data, 
              id: data.id || (new Date().toISOString() + Math.random()),
          };
          
          setReportData(reportWithId);
          
          // Notify App to add to list (App will respect the ID we just generated)
          if (onReportGenerated) onReportGenerated(reportWithId);
          
          setViewMode('report');
      } catch (error) {
          console.error(error);
          alert("Erro ao gerar relatório. Tente novamente.");
      } finally {
          setIsGeneratingReport(false);
      }
  };
  
  const handleDownloadPdf = () => {
    setIsPrinting(true);
  };
  
  useEffect(() => {
    if (isPrinting) {
      const generatePdf = async () => {
        const targetRef = viewMode === 'report' ? reportRef : pdfRef;
        const input = targetRef.current;
        
        if (!input) {
          setIsPrinting(false);
          return;
        }
        
        // Force strict width for A4 simulation during capture
        const originalWidth = input.style.width;
        const originalMinWidth = input.style.minWidth;
        
        // 794px is approx 210mm at 96 DPI. We use this as the reference render width.
        input.style.width = '794px'; 
        input.style.minWidth = '794px';

        const { jsPDF } = jspdf;
        // Use 'p', 'mm', 'a4'
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // DEFINING MARGINS (15mm)
        const margin = 15; 
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
        const usableWidth = pdfWidth - (margin * 2); // Available width for content
        
        const selector = '.pdf-section';
        const sections = Array.from(input.querySelectorAll(selector)) as HTMLElement[];
        
        let cursorY = margin; // Start at the top margin

        const canvasOptions = {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794,
        };

        for (const section of sections) {
          // Check for page break class
          if (section.classList.contains('break-before-page')) {
             if (cursorY > margin) { // If we are not at the very top
                pdf.addPage();
                cursorY = margin;
             }
          }

          const canvas = await html2canvas(section, canvasOptions);
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          // Calculate the height in the PDF based on the USABLE width (keeping aspect ratio)
          // The logic is: (Original Height / Original Width) * Target Width
          const finalImgHeight = (imgHeight * usableWidth) / imgWidth;

          // Check if image fits in the remaining space
          if (cursorY + finalImgHeight > pdfHeight - margin) {
            pdf.addPage();
            cursorY = margin; // Reset cursor to top margin
          }

          // Add image with margins
          pdf.addImage(imgData, 'PNG', margin, cursorY, usableWidth, finalImgHeight);
          
          // Minimal spacing between sections to keep things tight but distinct
          cursorY += finalImgHeight;
        }
        
        // Restore original styles
        input.style.width = originalWidth;
        input.style.minWidth = originalMinWidth;

        const fileName = viewMode === 'report' 
            ? `laudo-${editedQuote.clientName.replace(/\s/g, '_')}.pdf`
            : `${editedQuote.code || 'orcamento'}-${editedQuote.clientName.replace(/\s/g, '_')}.pdf`;
            
        pdf.save(fileName);
        setIsPrinting(false);
      };
      setTimeout(generatePdf, 500); // Small delay to allow DOM updates
    }
  }, [isPrinting, editedQuote, userSettings, viewMode, reportData]);


  const { subtotal, totalTax, grandTotal } = useMemo(() => {
    const sub = editedQuote.steps.reduce((acc, step) => acc + (Number(step.userPrice || 0) * Number(step.quantity || 0)), 0);
    const tax = editedQuote.steps.reduce((acc, step) => acc + ((Number(step.userPrice || 0) * Number(step.quantity || 0)) * (Number(step.taxRate || 0) / 100)), 0);
    return {
        subtotal: sub,
        totalTax: tax,
        grandTotal: sub + tax,
    };
  }, [editedQuote.steps]);
  
  const renderQuoteContent = () => (
      <div 
        id="pdf-content-inner" 
        // Remove padding in print mode so content fills the "usableWidth" determined by the PDF generator
        className={`bg-white ${isPrinting ? 'p-0 w-full' : 'p-6 sm:p-10 rounded-lg shadow-lg border border-gray-100'}`}
        style={isPrinting ? { minHeight: '297mm', boxSizing: 'border-box' } : {}}
      >
        
        {/* HEADER */}
        <div className={`pdf-section ${isPrinting ? 'mb-2' : 'mb-8'}`}>
             <div className="flex justify-between items-start pb-4 border-b-4 border-primary">
                <div className="flex items-center gap-4">
                    {userSettings.companyLogo ? (
                        <img src={userSettings.companyLogo} alt="Logo" className="h-20 max-w-[180px] object-contain" />
                    ) : (
                        <div className="h-16 w-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400 border border-gray-200">LOGO</div>
                    )}
                    <div className="text-left pl-4 border-l border-gray-200">
                        <h1 className="font-bold text-xl text-gray-900 uppercase tracking-tight">{userSettings.companyName}</h1>
                        <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                             <p>{userSettings.companyAddress}</p>
                             <p className="font-mono">NIF/CNPJ: {userSettings.companyTaxId}</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-wide">ORÇAMENTO</h2>
                    <div className="mt-2 flex flex-col items-end">
                        <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium text-gray-600 mb-1">
                             REF: <EditableHeaderInput isPrinting={isPrinting} value={editedQuote.code || ''} onChange={(val) => setEditedQuote(prev => ({...prev, code: val}))} className="font-mono font-bold text-gray-900" />
                        </div>
                        <p className="text-xs text-gray-400">Data: {new Date(editedQuote.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
             </div>
        </div>

        {/* CLIENT INFO & SUMMARY */}
        <div className={`pdf-section grid grid-cols-2 gap-8 ${isPrinting ? 'mb-2' : 'mb-8'}`}>
             <div className="bg-gray-50 p-4 rounded-sm border-l-4 border-gray-300">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Preparado Para</h3>
                 {isPrinting ? (
                    <div className="text-base text-gray-800 space-y-1">
                        <p className="font-bold text-lg">{editedQuote.clientName}</p>
                        <p>{editedQuote.clientAddress}</p>
                        <p>{editedQuote.clientContact}</p>
                    </div>
                 ) : (
                    <div className="space-y-2">
                        <EditableField label="Nome" value={editedQuote.clientName} onChange={val => handleClientDataChange('clientName', val)} />
                        <EditableField label="Endereço" value={editedQuote.clientAddress} onChange={val => handleClientDataChange('clientAddress', val)} />
                        <EditableField label="Contato" value={editedQuote.clientContact} onChange={val => handleClientDataChange('clientContact', val)} />
                    </div>
                 )}
             </div>
             <div className="p-2">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Resumo do Projeto</h3>
                 {isPrinting ? (
                     <div className="text-base text-gray-600 leading-relaxed italic border-b border-gray-100 pb-2">
                         "{editedQuote.summary}"
                     </div>
                 ) : (
                     <textarea
                        value={editedQuote.summary}
                        onChange={(e) => handleClientDataChange('summary', e.target.value)}
                        className="w-full text-base text-gray-600 leading-relaxed italic border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded p-2 bg-transparent resize-none outline-none transition-colors"
                        rows={4}
                        placeholder="Escreva um resumo do projeto..."
                     />
                 )}
                 <div className="mt-2">
                     {isPrinting ? (
                        <h4 className="text-xl font-bold text-primary">{editedQuote.title}</h4>
                     ) : (
                         <textarea
                            value={editedQuote.title}
                            onChange={(e) => handleClientDataChange('title', e.target.value)}
                            className="w-full text-xl font-bold text-primary border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded p-2 bg-transparent resize-none overflow-hidden outline-none transition-colors"
                            rows={2}
                            placeholder="Título do Orçamento"
                         />
                     )}
                 </div>
             </div>
        </div>
        
        {/* STEPS TABLE / LIST */}
        <div className={`${isPrinting ? 'mb-2' : 'mb-8'}`}>
            {!isPrinting && (
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Etapas do Serviço</h3>
                </div>
            )}

            {/* PRINT MODE: REAL TABLE SIMULATION WITH DIVS FOR PAGE BREAK */}
            {isPrinting ? (
                <div className="w-full text-sm">
                    {/* Table Header treated as a section */}
                    <div className="pdf-section flex bg-primary text-white uppercase text-xs tracking-wider font-semibold py-2 px-2">
                        <div className="w-[5%]">#</div>
                        <div className="w-[50%]">Descrição do Serviço</div>
                        <div className="w-[10%] text-center">Qtd</div>
                        <div className="w-[12%] text-right">Preço Unit.</div>
                        <div className="w-[8%] text-center">IVA</div>
                        <div className="w-[15%] text-right">Total</div>
                    </div>

                    {/* Table Rows treated as individual sections */}
                    {editedQuote.steps.map((step, index) => {
                        const lineTotal = (Number(step.userPrice) || 0) * (Number(step.quantity) || 0);
                        const lineTotalWithTax = lineTotal * (1 + (Number(step.taxRate) || 0) / 100);
                        return (
                            <div key={step.id} className="pdf-section flex border-b border-gray-100 py-3 px-2 break-inside-avoid">
                                <div className="w-[5%] text-gray-400 align-top">{index + 1}</div>
                                <div className="w-[50%] pr-2">
                                    <p className="font-bold text-gray-900 mb-1 text-base leading-tight">{step.title}</p>
                                    <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                                </div>
                                <div className="w-[10%] text-center align-top">
                                    {step.quantity} 
                                    <span className="text-[10px] text-gray-400 block">{step.suggestedUnit}</span>
                                </div>
                                <div className="w-[12%] text-right align-top whitespace-nowrap">{formatCurrency(step.userPrice, editedQuote.currency)}</div>
                                <div className="w-[8%] text-center align-top text-xs">{step.taxRate}%</div>
                                <div className="w-[15%] text-right font-bold align-top text-gray-900 whitespace-nowrap">{formatCurrency(lineTotalWithTax, editedQuote.currency)}</div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* EDIT MODE: IMPROVED CARD LAYOUT */
                <div className="space-y-8">
                    {editedQuote.steps.map((step, index) => {
                         const lineTotal = (Number(step.userPrice) || 0) * (Number(step.quantity) || 0);
                         const lineTotalWithTax = lineTotal * (1 + (Number(step.taxRate) || 0) / 100);
                         const isConfirming = confirmDeleteId === step.id;
                         
                         return (
                            <div key={step.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative group transition hover:shadow-md flex flex-col gap-6">
                                {/* Absolute Actions */}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition z-10">
                                    <button 
                                        onClick={() => {
                                            if (isConfirming) {
                                                handleDeleteStep(index);
                                                setConfirmDeleteId(null);
                                            } else {
                                                setConfirmDeleteId(step.id!);
                                                setTimeout(() => setConfirmDeleteId(null), 3000);
                                            }
                                        }}
                                        className={`p-2 rounded text-xs font-bold flex items-center shadow-sm ${isConfirming ? 'bg-red-600 text-white' : 'bg-white text-red-500 border border-gray-200 hover:bg-red-50'}`}
                                    >
                                        {isConfirming ? 'Confirmar' : <TrashIcon className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Main Content Block (Full Width) */}
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-base mt-1">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="flex-grow space-y-3">
                                        {/* Title as Textarea for multi-line support */}
                                        <textarea 
                                            value={step.title} 
                                            onChange={e => handleTitleChange(index, e.target.value)}
                                            className="w-full font-bold text-xl text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none bg-transparent resize-none leading-tight"
                                            rows={1}
                                            style={{ minHeight: '32px', height: 'auto' }}
                                            placeholder="Título do Serviço"
                                        />
                                        
                                        {/* Description */}
                                        <textarea 
                                            value={step.description} 
                                            onChange={e => handleDescriptionChange(index, e.target.value)}
                                            className="w-full text-base text-gray-600 border border-transparent hover:border-gray-200 focus:border-primary focus:ring-0 rounded p-2 -ml-2 bg-transparent resize-none leading-relaxed"
                                            rows={4}
                                            placeholder="Descrição detalhada do serviço..."
                                        />
                                    </div>
                                </div>

                                {/* Financials Bar (Bottom) */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Quantidade</label>
                                            <div className="relative">
                                                <input type="number" value={step.quantity} onChange={e => handleQuantityChange(index, e.target.value)} className="w-full bg-white border border-gray-200 rounded p-2 text-center font-medium text-base focus:ring-primary focus:border-primary" />
                                                <span className="absolute right-8 top-2 text-xs text-gray-400 pointer-events-none hidden sm:block">{step.suggestedUnit}</span>
                                            </div>
                                        </div>
                                        <div>
                                             <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Preço Unit. ({editedQuote.currency})</label>
                                             <input type="number" value={step.userPrice} onChange={e => handlePriceChange(index, e.target.value)} className="w-full bg-white border border-gray-200 rounded p-2 text-center font-medium text-base focus:ring-primary focus:border-primary" />
                                        </div>
                                        <div>
                                             <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Imposto (IVA)</label>
                                             <select value={step.taxRate ?? 0} onChange={e => handleTaxChange(index, e.target.value)} className="w-full bg-white border border-gray-200 rounded p-2 text-center font-medium text-base focus:ring-primary focus:border-primary cursor-pointer">
                                                 <option value="0">0%</option>
                                                 <option value="6">6%</option>
                                                 <option value="13">13%</option>
                                                 <option value="23">23%</option>
                                             </select>
                                        </div>
                                        <div className="text-right bg-white border border-gray-200 rounded p-2 flex flex-col justify-center h-[42px]">
                                            <span className="text-xs text-gray-400 block uppercase leading-none mb-1">Total</span>
                                            <span className="font-bold text-primary text-lg leading-none">{formatCurrency(lineTotalWithTax, editedQuote.currency)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* AI Suggestion Footer */}
                                    <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                                        <div className="flex items-center text-xs text-gray-400">
                                            <SparklesIcon className="h-3 w-3 mr-1" />
                                            Sugestão IA: {formatCurrency(step.suggestedPrice, editedQuote.currency)} / {step.suggestedUnit || 'un'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                         )
                    })}

                    {/* Add Step Box */}
                    <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-4 transition hover:bg-blue-100 hover:border-blue-300">
                         <div className="flex-grow w-full">
                             <input 
                                type="text" 
                                value={newStepDescription}
                                onChange={(e) => setNewStepDescription(e.target.value)}
                                placeholder="Descreva uma nova etapa para a IA adicionar (Ex: Limpeza final da obra)"
                                className="w-full p-3 bg-white border border-blue-200 rounded text-base focus:ring-2 focus:ring-primary outline-none"
                             />
                         </div>
                         <button 
                            onClick={handleAddStepWithAI}
                            disabled={isAddingStep || !newStepDescription}
                            className="bg-primary text-white px-6 py-3 rounded shadow-sm hover:bg-secondary disabled:opacity-50 flex items-center font-medium text-base whitespace-nowrap"
                         >
                             {isAddingStep ? <span className="animate-spin mr-2">⚙️</span> : <SparklesIcon className="h-5 w-5 mr-2" />}
                             Adicionar
                         </button>
                    </div>
                </div>
            )}
        </div>

        {/* TOTALS SECTION - REFACTORED TO BE EDITABLE AND FLEXIBLE */}
        <div className={`pdf-section break-inside-avoid flex flex-col items-end ${isPrinting ? 'mt-2' : 'mt-8'}`}>
             <div className="w-full sm:w-auto min-w-[280px]">
                 
                 {/* Subtotal Row */}
                 <div className="flex justify-between items-center py-2 border-b border-gray-100 text-base text-gray-600">
                     <EditableHeaderInput 
                        isPrinting={isPrinting}
                        value={totalLabels.subtotal}
                        onChange={(v) => setTotalLabels(prev => ({...prev, subtotal: v}))}
                        className="text-right mr-4 font-medium w-32"
                     />
                     <span className="font-medium">{formatCurrency(subtotal, editedQuote.currency)}</span>
                 </div>

                 {/* Tax Row */}
                 <div className="flex justify-between items-center py-2 border-b border-gray-100 text-base text-gray-600">
                     <EditableHeaderInput 
                        isPrinting={isPrinting}
                        value={totalLabels.tax}
                        onChange={(v) => setTotalLabels(prev => ({...prev, tax: v}))}
                        className="text-right mr-4 font-medium w-32"
                     />
                     <span className="font-medium">{formatCurrency(totalTax, editedQuote.currency)}</span>
                 </div>

                 {/* Grand Total Container - Adjustable Width */}
                 <div className="flex flex-row items-center justify-between gap-6 mt-4 bg-gray-50 px-5 py-4 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
                     <EditableHeaderInput 
                        isPrinting={isPrinting}
                        value={totalLabels.total}
                        onChange={(v) => setTotalLabels(prev => ({...prev, total: v}))}
                        className="font-bold text-lg sm:text-xl uppercase bg-transparent border-none w-32"
                     />
                     <span className="font-extrabold text-lg text-primary whitespace-nowrap">
                        {formatCurrency(grandTotal, editedQuote.currency)}
                     </span>
                 </div>
             </div>
        </div>
        
        {/* TERMS AND CONDITIONS & OBSERVATIONS */}
        <div className={`pdf-section ${isPrinting ? 'mt-4 pt-4' : 'mt-12 pt-8'} border-t border-gray-200 break-inside-avoid`}>
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Condições Comerciais e Notas</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Prazo de Execução</p>
                     {isPrinting ? (
                         <p className="text-base font-medium text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">{editedQuote.executionTime || 'A definir'}</p>
                     ) : (
                         <input type="text" value={editedQuote.executionTime || ''} onChange={e => handleClientDataChange('executionTime', e.target.value)} className="w-full text-base border border-gray-300 rounded p-3" placeholder="Ex: 5 dias úteis" />
                     )}
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Forma de Pagamento</p>
                    {isPrinting ? (
                        <p className="text-base font-medium text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">{editedQuote.paymentTerms || 'A combinar'}</p>
                    ) : (
                         <input type="text" value={editedQuote.paymentTerms || ''} onChange={e => handleClientDataChange('paymentTerms', e.target.value)} className="w-full text-base border border-gray-300 rounded p-3" placeholder="Ex: 50% entrada" />
                    )}
                </div>
             </div>

             {/* NEW OBSERVATIONS FIELD */}
             <div className="mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Observações Gerais</p>
                 {isPrinting ? (
                     <div className="text-base text-gray-800 bg-gray-50 p-4 rounded border border-gray-100 min-h-[80px] whitespace-pre-line">
                        {editedQuote.observations || 'Nenhuma observação adicional.'}
                     </div>
                 ) : (
                     <textarea
                        value={editedQuote.observations || ''}
                        onChange={e => handleClientDataChange('observations', e.target.value)}
                        className="w-full text-base border border-gray-300 rounded p-3 focus:ring-primary focus:border-primary"
                        placeholder="Ex: O material X não está incluso no orçamento. Validade da proposta sujeita a alteração de preços de fornecedores."
                        rows={3}
                     />
                )}
             </div>
             
             {/* Footer Disclaimer */}
             <div className="mt-16 text-center text-xs text-gray-400 uppercase tracking-wide">
                 <p>Orçamento válido por 30 dias. Sujeito a confirmação final após visita técnica (se aplicável).</p>
             </div>
        </div>

      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       {/* Action Bar */}
       <div className="sticky top-0 z-50 bg-gray-100/90 backdrop-blur-sm p-2 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center border border-gray-200 shadow-sm gap-3 sm:gap-0">
           <div className="flex space-x-2">
                <button
                    onClick={() => setViewMode('quote')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${viewMode === 'quote' ? 'bg-white text-primary ring-1 ring-gray-200' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}
                >
                    Orçamento
                </button>
                <button
                    onClick={() => reportData ? setViewMode('report') : handleGenerateReport()}
                    disabled={isGeneratingReport}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm flex items-center ${viewMode === 'report' ? 'bg-white text-primary ring-1 ring-gray-200' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}
                >
                    {isGeneratingReport ? 'Gerando...' : 'Laudo Técnico'}
                    {!reportData && !isGeneratingReport && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>}
                </button>
           </div>
           
           {!isPrinting && (
               <div className="flex items-center space-x-4">
                  {/* Saving Indicator */}
                  <span className="text-xs text-gray-400 flex items-center">
                       {saveStatus === 'saving' ? 'Salvando...' : 'Salvo'}
                       {saveStatus === 'saved' && <CheckCircleIcon className="h-3 w-3 ml-1 text-green-500" />}
                  </span>

                  <div className="flex space-x-2">
                    <button onClick={handleDownloadPdf} className="p-2 text-gray-600 hover:text-primary hover:bg-white rounded-full transition" title="Baixar PDF">
                        <DownloadIcon className="h-5 w-5" />
                    </button>
                    {viewMode === 'quote' && (
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-md flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Salvar e Sair
                        </button>
                    )}
                  </div>
               </div>
           )}
       </div>

      {viewMode === 'quote' ? (
        <div ref={pdfRef} className="flex justify-center">
          {renderQuoteContent()}
        </div>
      ) : (
          reportData && (
            <div ref={reportRef}>
                <TechnicalReport 
                    data={reportData} 
                    onUpdate={setReportData} 
                    userSettings={userSettings} 
                    images={imagePreviews} 
                    isPrinting={isPrinting}
                    onAddImage={handleAddImage}
                    onRemoveImage={handleRemoveImage}
                    onAutoDescribe={handleAutoDescribeImage}
                />
            </div>
          )
      )}
    </div>
  );
};
