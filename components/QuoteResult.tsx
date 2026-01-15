
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { QuoteData, QuoteStep, Currency, UserSettings, TechnicalReportData } from '../types';
import { CheckCircleIcon, PencilIcon, DownloadIcon, TrashIcon, PlusIcon, SparklesIcon, ShieldCheckIcon } from './AppIcons';
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
  onGenerateWarranty?: (quote: QuoteData) => void; // Callback to generate warranty
  onGenerateReceipt?: (quote: QuoteData) => void; // Callback to generate receipt
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

export const QuoteResult: React.FC<QuoteResultProps> = ({ quote, userSettings, images, onReset, onSaveOrUpdate, onAutoSave, isViewingSaved, onReportGenerated, onReportUpdate, onGenerateWarranty, onGenerateReceipt }) => {
  const [editedQuote, setEditedQuote] = useState<QuoteData>(() => {
      const initialQuote = JSON.parse(JSON.stringify(quote));
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
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
  const [totalLabels, setTotalLabels] = useState({
      subtotal: 'Subtotal',
      tax: 'Impostos (IVA)',
      total: 'Total Geral'
  });
  
  const [managedFiles, setManagedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [newStepDescription, setNewStepDescription] = useState('');
  const [isAddingStep, setIsAddingStep] = useState(false);
  
  const pdfRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (images && images.length > 0) {
        setManagedFiles(images);
    }
  }, [images]);

  useEffect(() => {
    const previews = managedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => {
        previews.forEach(url => URL.revokeObjectURL(url));
    }
  }, [managedFiles]);

  useEffect(() => {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
          onAutoSave(editedQuote);
          setSaveStatus('saved');
      }, 1000);
      return () => clearTimeout(timer);
  }, [editedQuote, onAutoSave]);

  const handleDownloadPdf = () => {
    setIsPrinting(true);
  };
  
  useEffect(() => {
    if (isPrinting) {
      const generatePdf = async () => {
        const targetRef = viewMode === 'report' ? reportRef : pdfRef;
        const input = targetRef.current;
        if (!input) { setIsPrinting(false); return; }
        
        const originalWidth = input.style.width;
        const originalMinWidth = input.style.minWidth;
        input.style.width = '794px'; 
        input.style.minWidth = '794px';

        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 15; 
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const usableWidth = pdfWidth - (margin * 2);
        const sections = Array.from(input.querySelectorAll('.pdf-section')) as HTMLElement[];
        let cursorY = margin;

        const canvasOptions = {
            scale: 1.5, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794,
            imageTimeout: 0
        };

        for (const section of sections) {
          if (section.classList.contains('break-before-page')) {
             if (cursorY > margin) { pdf.addPage(); cursorY = margin; }
          }

          const canvas = await html2canvas(section, canvasOptions);
          const imgData = canvas.toDataURL('image/jpeg', 0.7);
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const finalImgHeight = (imgHeight * usableWidth) / imgWidth;

          if (cursorY + finalImgHeight > pdfHeight - margin) {
            pdf.addPage();
            cursorY = margin;
          }
          pdf.addImage(imgData, 'JPEG', margin, cursorY, usableWidth, finalImgHeight, undefined, 'FAST');
          cursorY += finalImgHeight + 7; 
        }
        
        input.style.width = originalWidth;
        input.style.minWidth = originalMinWidth;

        const fileName = viewMode === 'report' 
            ? `laudo-${editedQuote.clientName.replace(/\s/g, '_')}.pdf`
            : `${editedQuote.code || 'orcamento'}-${editedQuote.clientName.replace(/\s/g, '_')}.pdf`;
            
        pdf.save(fileName);
        setIsPrinting(false);
      };
      setTimeout(generatePdf, 500);
    }
  }, [isPrinting, editedQuote, userSettings, viewMode, reportData]);

  const { subtotal, totalTax, grandTotal } = useMemo(() => {
    const sub = editedQuote.steps.reduce((acc, step) => acc + (Number(step.userPrice || 0) * Number(step.quantity || 0)), 0);
    const tax = editedQuote.steps.reduce((acc, step) => acc + ((Number(step.userPrice || 0) * Number(step.quantity || 0)) * (Number(step.taxRate || 0) / 100)), 0);
    const calcTotal = sub + tax;
    const finalTotal = editedQuote.customTotal !== undefined ? editedQuote.customTotal : calcTotal;
    return { subtotal: sub, totalTax: tax, grandTotal: finalTotal };
  }, [editedQuote.steps, editedQuote.customTotal]);
  
  const handleSave = () => { onSaveOrUpdate(editedQuote); };

  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      try {
          const data = await generateTechnicalReport(editedQuote, managedFiles, userSettings.companyName, editedQuote.code);
          const reportWithId = { ...data, id: data.id || (new Date().toISOString() + Math.random()) };
          setReportData(reportWithId);
          if (onReportGenerated) onReportGenerated(reportWithId);
          setViewMode('report');
      } catch (error) {
          alert("Erro ao gerar relatório.");
      } finally { setIsGeneratingReport(false); }
  };

  // DRAG AND DROP HANDLERS
  const onDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newSteps = [...editedQuote.steps];
    const draggedItem = newSteps[draggedItemIndex];
    newSteps.splice(draggedItemIndex, 1);
    newSteps.splice(index, 0, draggedItem);

    setDraggedItemIndex(index);
    setEditedQuote(prev => ({ ...prev, steps: newSteps }));
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const renderQuoteContent = () => (
      <div id="pdf-content-inner" className={`bg-white ${isPrinting ? 'p-0 w-full' : 'p-6 sm:p-10 rounded-lg shadow-lg border border-gray-100'}`} style={isPrinting ? { minHeight: '297mm', boxSizing: 'border-box' } : {}}>
        <div className={`pdf-section ${isPrinting ? 'mb-5' : 'mb-8'}`}>
             <div className="flex justify-between items-start pb-4 border-b-4 border-primary">
                <div className="flex items-center gap-4">
                    {userSettings.companyLogo ? (
                        <img src={userSettings.companyLogo} alt="Logo" className={`${isPrinting ? 'h-32 max-w-[250px]' : 'h-20 max-w-[180px]'} object-contain`} />
                    ) : (
                        <div className="h-16 w-32 bg-gray-100 flex items-center justify-center text-xs text-gray-400 border border-gray-200">LOGO</div>
                    )}
                    <div className="text-left pl-4 border-l border-gray-200">
                        <h1 className={`font-bold text-gray-900 uppercase tracking-tight ${isPrinting ? 'text-2xl' : 'text-xl'}`}>{userSettings.companyName}</h1>
                        <div className={`text-gray-500 mt-1 space-y-0.5 ${isPrinting ? 'text-base' : 'text-sm'}`}>
                             <p>{userSettings.companyAddress}</p>
                             <p className="font-mono">NIF/CNPJ: {userSettings.companyTaxId}</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className={`font-extrabold text-gray-900 tracking-wide ${isPrinting ? 'text-4xl' : 'text-3xl'}`}>ORÇAMENTO</h2>
                    <div className="mt-2 flex flex-col items-end">
                        <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium text-gray-600 mb-1">
                             REF: <EditableHeaderInput isPrinting={isPrinting} value={editedQuote.code || ''} onChange={(val) => setEditedQuote(prev => ({...prev, code: val}))} className="font-mono font-bold text-gray-900" />
                        </div>
                        <p className={`text-gray-400 ${isPrinting ? 'text-sm' : 'text-xs'}`}>Data: {new Date(editedQuote.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
             </div>
        </div>

        <div className={`pdf-section grid grid-cols-2 gap-8 ${isPrinting ? 'mb-5' : 'mb-8'}`}>
             <div className="bg-gray-50 p-4 rounded-sm border-l-4 border-gray-300">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Preparado Para</h3>
                 {isPrinting ? (
                    <div className="text-gray-800 space-y-1 text-lg">
                        <p className="font-bold text-xl">{editedQuote.clientName}</p>
                        <p>{editedQuote.clientAddress}</p>
                        <p>{editedQuote.clientContact}</p>
                    </div>
                 ) : (
                    <div className="space-y-2">
                        <EditableField label="Nome" value={editedQuote.clientName} onChange={val => setEditedQuote(prev => ({...prev, clientName: val}))} />
                        <EditableField label="Endereço" value={editedQuote.clientAddress} onChange={val => setEditedQuote(prev => ({...prev, clientAddress: val}))} />
                        <EditableField label="Contato" value={editedQuote.clientContact} onChange={val => setEditedQuote(prev => ({...prev, clientContact: val}))} />
                    </div>
                 )}
             </div>
             <div className="p-2">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Resumo do Projeto</h3>
                 {isPrinting ? (
                     <div className="text-lg text-gray-600 leading-relaxed italic border-b border-gray-100 pb-2">"{editedQuote.summary}"</div>
                 ) : (
                     <textarea value={editedQuote.summary} onChange={(e) => setEditedQuote(prev => ({...prev, summary: e.target.value}))} className="w-full text-base text-gray-600 leading-relaxed italic border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded p-2 bg-transparent resize-none outline-none transition-colors" rows={4} />
                 )}
                 <div className="mt-2">
                     {isPrinting ? ( <h4 className="text-2xl font-bold text-primary">{editedQuote.title}</h4> ) : (
                         <textarea value={editedQuote.title} onChange={(e) => setEditedQuote(prev => ({...prev, title: e.target.value}))} className="w-full text-xl font-bold text-primary border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded p-2 bg-transparent resize-none overflow-hidden outline-none transition-colors" rows={2} />
                     )}
                 </div>
             </div>
        </div>
        
        <div className={`${isPrinting ? 'mb-5' : 'mb-8'}`}>
            {isPrinting ? (
                <div className="w-full text-base">
                    <div className="pdf-section flex bg-primary text-white uppercase text-sm tracking-wider font-semibold py-2 px-2 mb-2">
                        <div className="w-[5%]">#</div>
                        <div className="w-[50%]">Descrição do Serviço</div>
                        <div className="w-[10%] text-center">Qtd</div>
                        <div className="w-[12%] text-right">Preço Unit.</div>
                        <div className="w-[8%] text-center">IVA</div>
                        <div className="w-[15%] text-right">Total</div>
                    </div>
                    {editedQuote.steps.map((step, index) => {
                        const lineTotal = (Number(step.userPrice) || 0) * (Number(step.quantity) || 0);
                        const lineTotalWithTax = lineTotal * (1 + (Number(step.taxRate) || 0) / 100);
                        return (
                            <div key={step.id} className="pdf-section flex border-b border-gray-100 py-3 px-2 break-inside-avoid mb-2">
                                <div className="w-[5%] text-gray-400 align-top pt-1">{index + 1}</div>
                                <div className="w-[50%] pr-2">
                                    <p className="font-bold text-gray-900 mb-1 text-lg leading-tight">{step.title}</p>
                                    {step.description && <p className="text-gray-600 text-base leading-relaxed">{step.description}</p>}
                                </div>
                                <div className="w-[10%] text-center align-top pt-1">{step.quantity} <span className="text-xs text-gray-400 block">{step.suggestedUnit}</span></div>
                                <div className="w-[12%] text-right align-top whitespace-nowrap pt-1">{formatCurrency(step.userPrice, editedQuote.currency)}</div>
                                <div className="w-[8%] text-center align-top text-sm pt-1">{step.taxRate}%</div>
                                <div className="w-[15%] text-right font-bold align-top text-gray-900 whitespace-nowrap pt-1">{formatCurrency(lineTotalWithTax, editedQuote.currency)}</div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-8">
                    {editedQuote.steps.map((step, index) => {
                         const lineTotal = (Number(step.userPrice) || 0) * (Number(step.quantity) || 0);
                         const lineTotalWithTax = lineTotal * (1 + (Number(step.taxRate) || 0) / 100);
                         const isDragging = draggedItemIndex === index;

                         return (
                            <div 
                                key={step.id} 
                                draggable
                                onDragStart={() => onDragStart(index)}
                                onDragOver={(e) => onDragOver(e, index)}
                                onDragEnd={onDragEnd}
                                className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative group transition hover:shadow-md flex flex-col gap-6 cursor-move ${isDragging ? 'opacity-50 ring-2 ring-primary border-transparent' : ''}`}
                            >
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition z-10 flex gap-2">
                                    <button onClick={() => setEditedQuote(prev => ({...prev, steps: prev.steps.filter((_, i) => i !== index)}))} className="p-2 rounded text-xs font-bold bg-white text-red-500 border border-gray-200 hover:bg-red-50 shadow-sm"><TrashIcon className="h-5 w-5" /></button>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center gap-1 mt-1 flex-shrink-0">
                                        <div className="h-8 w-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-base">{index + 1}</div>
                                        <div className="text-gray-300 opacity-50 group-hover:opacity-100 transition">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" /></svg>
                                        </div>
                                    </div>
                                    <div className="flex-grow space-y-3">
                                        <textarea value={step.title} onChange={e => {const s=[...editedQuote.steps]; s[index].title=e.target.value; setEditedQuote({...editedQuote, steps:s})}} className="w-full font-bold text-xl text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none bg-transparent resize-none cursor-text" rows={1} onClick={e => e.stopPropagation()} />
                                        <textarea value={step.description} onChange={e => {const s=[...editedQuote.steps]; s[index].description=e.target.value; setEditedQuote({...editedQuote, steps:s})}} className="w-full text-base text-gray-600 border border-transparent hover:border-gray-200 focus:border-primary rounded p-2 -ml-2 bg-transparent resize-none cursor-text" rows={step.description ? 4 : 2} onClick={e => e.stopPropagation()} />
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 cursor-default" onClick={e => e.stopPropagation()}>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                                        <input type="number" value={step.quantity} onChange={e => {const s=[...editedQuote.steps]; s[index].quantity=Number(e.target.value); setEditedQuote({...editedQuote, steps:s})}} className="w-full bg-white border border-gray-200 rounded p-2 text-center" />
                                        <input type="number" value={step.userPrice} onChange={e => {const s=[...editedQuote.steps]; s[index].userPrice=Number(e.target.value); setEditedQuote({...editedQuote, steps:s})}} className="w-full bg-white border border-gray-200 rounded p-2 text-center" />
                                        <select value={step.taxRate} onChange={e => {const s=[...editedQuote.steps]; s[index].taxRate=Number(e.target.value); setEditedQuote({...editedQuote, steps:s})}} className="w-full bg-white border border-gray-200 rounded p-2 text-center"><option value="0">0%</option><option value="6">6%</option><option value="13">13%</option><option value="23">23%</option></select>
                                        <div className="text-right bg-white border border-gray-200 rounded p-2 flex flex-col justify-center h-[42px]"><span className="font-bold text-primary text-lg">{formatCurrency(lineTotalWithTax, editedQuote.currency)}</span></div>
                                    </div>
                                </div>
                            </div>
                         )
                    })}
                    <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-4">
                         <input type="text" value={newStepDescription} onChange={(e) => setNewStepDescription(e.target.value)} placeholder="Descreva uma nova etapa..." className="flex-grow p-3 bg-white border border-blue-200 rounded" />
                         <button onClick={async () => {setIsAddingStep(true); const n=await generateSingleQuoteStep(newStepDescription, editedQuote.city, editedQuote.currency); setEditedQuote(p=>({...p, steps:[...p.steps, n]})); setNewStepDescription(''); setIsAddingStep(false)}} disabled={isAddingStep || !newStepDescription} className="bg-primary text-white px-6 py-3 rounded shadow-sm hover:bg-secondary disabled:opacity-50 flex items-center">{isAddingStep ? '...' : 'Adicionar'}</button>
                    </div>
                </div>
            )}
        </div>

        <div className={`pdf-section break-inside-avoid flex flex-col items-end ${isPrinting ? 'mt-5' : 'mt-8'}`}>
             <div className="w-full sm:w-auto min-w-[280px]">
                 <div className="flex justify-between items-center py-2 border-b border-gray-100 text-gray-600"><span>{totalLabels.subtotal}</span><span>{formatCurrency(subtotal, editedQuote.currency)}</span></div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100 text-gray-600"><span>{totalLabels.tax}</span><span>{formatCurrency(totalTax, editedQuote.currency)}</span></div>
                 <div className="flex flex-row items-center justify-between gap-6 mt-4 bg-gray-50 px-5 py-4 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
                     <span className="font-bold uppercase">{totalLabels.total}</span>
                     <span className="font-extrabold text-2xl text-primary">{formatCurrency(grandTotal, editedQuote.currency)}</span>
                 </div>
             </div>
        </div>
        
        <div className={`pdf-section ${isPrinting ? 'mt-8 pt-4' : 'mt-12 pt-8'} border-t border-gray-200 break-inside-avoid`}>
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">Condições Comerciais e Notas</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div><p className="text-xs font-bold text-gray-400 uppercase mb-2">Prazo de Execução</p><p className="text-lg font-medium text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">{editedQuote.executionTime || 'A definir'}</p></div>
                <div><p className="text-xs font-bold text-gray-400 uppercase mb-2">Forma de Pagamento</p><p className="text-lg font-medium text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">{editedQuote.paymentTerms || 'A combinar'}</p></div>
             </div>
             <div className="mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Observações Gerais</p>
                <div className="text-base text-gray-800 bg-gray-50 p-4 rounded border border-gray-100 min-h-[80px] whitespace-pre-line">{editedQuote.observations || 'Nenhuma observação adicional.'}</div>
             </div>
             <div className="mt-16 text-center text-xs text-gray-400 uppercase tracking-wide"><p>Orçamento válido por 30 dias.</p></div>
        </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="sticky top-0 z-50 bg-gray-100/90 backdrop-blur-sm p-2 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center border border-gray-200 shadow-sm gap-3 sm:gap-0">
           <div className="flex space-x-2">
                <button onClick={() => setViewMode('quote')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'quote' ? 'bg-white text-primary ring-1 ring-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>Orçamento</button>
                <button onClick={() => reportData ? setViewMode('report') : handleGenerateReport()} disabled={isGeneratingReport} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'report' ? 'bg-white text-primary ring-1 ring-gray-200' : 'text-gray-500 hover:bg-gray-200'}`}>{isGeneratingReport ? 'Gerando...' : 'Laudo Técnico'}</button>
                {onGenerateWarranty && <button onClick={() => onGenerateWarranty(editedQuote)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-200">Garantia</button>}
                {onGenerateReceipt && <button onClick={() => onGenerateReceipt(editedQuote)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-200">Recibo</button>}
           </div>
           {!isPrinting && (
               <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">{saveStatus === 'saving' ? 'Salvando...' : 'Salvo'}</span>
                  <div className="flex space-x-2">
                    <button onClick={handleDownloadPdf} className="p-2 text-gray-600 hover:text-primary hover:bg-white rounded-full"><DownloadIcon className="h-5 w-5" /></button>
                    {viewMode === 'quote' && <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold">Salvar e Sair</button>}
                  </div>
               </div>
           )}
       </div>
      <div ref={viewMode === 'report' ? reportRef : pdfRef} className="flex justify-center">
        {viewMode === 'quote' ? renderQuoteContent() : (reportData && <TechnicalReport data={reportData} onUpdate={setReportData} userSettings={userSettings} images={imagePreviews} isPrinting={isPrinting} onAddImage={(f)=>setManagedFiles(p=>[...p,f])} onRemoveImage={(i)=>setManagedFiles(p=>p.filter((_,x)=>x!==i))} onAutoDescribe={analyzeImageForReport} />)}
      </div>
    </div>
  );
};
