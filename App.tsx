
import React, { useState, useCallback, useEffect } from 'react';
import type { QuoteData, Currency, UserSettings, TechnicalReportData } from './types';
import { QuoteInputForm } from './components/QuoteInputForm';
import { ReportInputForm } from './components/ReportInputForm';
import { QuoteResult } from './components/QuoteResult';
import { TechnicalReport } from './components/TechnicalReport';
import { LoadingSpinner } from './components/LoadingSpinner';
import { QuoteHistory } from './components/QuoteHistory';
import { generateQuote, generateDirectTechnicalReport, analyzeImageForReport, validateDescription } from './services/geminiService';
import { LogoIcon, HistoryIcon, PencilIcon, UploadIcon, CogIcon, ClipboardDocumentIcon, CheckCircleIcon, GlobeIcon, SparklesIcon } from './components/AppIcons';
import { ClarificationModal } from './components/ClarificationModal';

// Make jspdf and html2canvas available in the scope (for Report only mode)
declare const jspdf: any;
declare const html2canvas: any;

type Page = 'home' | 'form' | 'report-form' | 'loading' | 'result' | 'report-view' | 'history' | 'view' | 'settings';

// VERSÃO DO APLICATIVO
const APP_VERSION = "v2.1";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
};

const LandingPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in text-center">
        <div className="mb-8 transform hover:scale-105 transition duration-500">
            <LogoIcon className="h-32 w-32 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            IA de Orçamentos
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed">
            Crie orçamentos detalhados e laudos técnicos profissionais em segundos utilizando inteligência artificial.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
            <button 
                onClick={() => onNavigate('form')}
                className="flex flex-col items-center justify-center p-8 bg-white border-2 border-primary rounded-xl shadow-sm hover:shadow-xl hover:bg-blue-50 transition group"
            >
                <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-white transition">
                    <PencilIcon className="h-10 w-10 text-primary" />
                </div>
                <span className="text-xl font-bold text-gray-800 group-hover:text-primary">Novo Orçamento</span>
                <span className="text-sm text-gray-500 mt-2">Gerar cotação de serviços</span>
            </button>

            <button 
                onClick={() => onNavigate('report-form')}
                className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-xl hover:border-secondary hover:bg-gray-50 transition group"
            >
                <div className="bg-gray-100 p-4 rounded-full mb-4 group-hover:bg-white transition">
                    <ClipboardDocumentIcon className="h-10 w-10 text-gray-600 group-hover:text-secondary" />
                </div>
                <span className="text-xl font-bold text-gray-800 group-hover:text-secondary">Novo Laudo</span>
                <span className="text-sm text-gray-500 mt-2">Relatório técnico pericial</span>
            </button>
        </div>
        
        <div className="mt-12 mb-8">
             <button 
                onClick={() => onNavigate('history')}
                className="flex items-center text-gray-500 hover:text-primary transition"
            >
                <HistoryIcon className="h-5 w-5 mr-2" />
                Acessar Histórico Salvo
            </button>
        </div>

        {/* Mensagem Especial de Incentivo */}
        <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-2xl max-w-lg w-full text-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-10">
                <SparklesIcon className="h-24 w-24 text-indigo-600" />
            </div>
            <p className="text-indigo-900 font-medium text-lg mb-2 flex items-center justify-center gap-2">
                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                Para <span className="font-bold text-indigo-700">Gilmar e Kelly</span> ❤️
            </p>
            <p className="text-indigo-700/80 text-sm leading-relaxed">
                Não tenham medo da tecnologia! Este aplicativo foi feito com muito carinho para facilitar o dia a dia de vocês.
                Estamos muito orgulhosos dessa nova etapa no mundo digital. Usem sem receio, vocês vão tirar de letra!
            </p>
        </div>
    </div>
);

const UserSettingsForm: React.FC<{ settings: UserSettings; onSave: (newSettings: UserSettings) => void; }> = ({ settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          const base64Logo = await fileToBase64(file);
          setLocalSettings(prev => ({ ...prev, companyLogo: base64Logo }));
        } catch (error) {
          console.error("Error converting file to base64", error);
          alert("Não foi possível carregar a imagem.");
        }
      }
    };
    
    const applyProfile = (profile: 'pt' | 'br') => {
        if (profile === 'pt') {
            setLocalSettings(prev => ({
                ...prev,
                companyName: 'HidroClean Canalizações',
                companySlogan: 'Sistemas Hidráulicos, Diagnóstico Técnico e Remodelações',
                companyAddress: 'Rua das Fontaínhas, 51 2700-391 - Amadora, Portugal',
                companyTaxId: '518050955'
            }));
        } else {
            setLocalSettings(prev => ({
                ...prev,
                companyName: 'Gilmar Rocha Construções',
                companySlogan: 'Reformas, Construção Civil e Acabamentos',
                companyAddress: 'Av. Paulista, 1000 - São Paulo, SP - Brasil',
                companyTaxId: '12.345.678/0001-90'
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      onSave(localSettings);
      setTimeout(() => {
          setIsSaving(false);
          alert("Configurações salvas com sucesso!");
      }, 500);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800">Configurações da Empresa</h2>
        
        {/* Company Profiles */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <p className="text-sm text-primary font-bold mb-3 uppercase tracking-wide">Seleção Rápida de Perfil</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                    type="button"
                    onClick={() => applyProfile('pt')}
                    className="flex items-center justify-center px-4 py-2 bg-white border border-blue-200 rounded shadow-sm hover:bg-blue-100 text-blue-800 transition"
                >
                    <GlobeIcon className="h-4 w-4 mr-2" />
                    Perfil Portugal (HidroClean)
                </button>
                <button 
                    type="button"
                    onClick={() => applyProfile('br')}
                    className="flex items-center justify-center px-4 py-2 bg-white border border-green-200 rounded shadow-sm hover:bg-green-100 text-green-800 transition"
                >
                    <GlobeIcon className="h-4 w-4 mr-2" />
                    Perfil Brasil (Gilmar Rocha)
                </button>
            </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg space-y-4 bg-white">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
            <input type="text" id="companyName" name="companyName" value={localSettings.companyName} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Minha Empresa" />
          </div>
          <div>
             <label htmlFor="companySlogan" className="block text-sm font-medium text-gray-700 mb-1">Slogan / Área de Atuação</label>
             <input type="text" id="companySlogan" name="companySlogan" value={localSettings.companySlogan || ''} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Sistemas Hidráulicos..." />
          </div>
          <div>
            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input type="text" id="companyAddress" name="companyAddress" value={localSettings.companyAddress} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Rua Principal, 123, Cidade" />
          </div>
          <div>
            <label htmlFor="companyTaxId" className="block text-sm font-medium text-gray-700 mb-1">NIF / Contribuinte / CNPJ</label>
            <input type="text" id="companyTaxId" name="companyTaxId" value={localSettings.companyTaxId} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="999999999" />
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Logo da Empresa</h3>
            <div className="flex items-center gap-6">
                {localSettings.companyLogo ? (<img src={localSettings.companyLogo} alt="Logo da Empresa" className="h-20 w-20 object-contain rounded-md bg-gray-100 p-1" />) : (<div className="h-20 w-20 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">Sem Logo</div>)}
                <div>
                    <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        <UploadIcon className="h-5 w-5 mr-2" />
                        {localSettings.companyLogo ? 'Alterar Logo' : 'Carregar Logo'}
                    </label>
                    <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleLogoChange} />
                    <p className="text-xs text-gray-500 mt-2">Recomendado: PNG ou JPG.</p>
                </div>
            </div>
        </div>
        <button type="submit" disabled={isSaving} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition">
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    );
};

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [currentReport, setCurrentReport] = useState<TechnicalReportData | null>(null);
  const [currentImages, setCurrentImages] = useState<File[]>([]); // Keep images in state
  const [currentImagePreviews, setCurrentImagePreviews] = useState<string[]>([]); // For report view
  
  const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([]);
  const [savedReports, setSavedReports] = useState<TechnicalReportData[]>([]);
  
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [error, setError] = useState<string | null>(null);
  const [isPrintingReport, setIsPrintingReport] = useState(false);

  // Validation Modal State
  const [clarificationState, setClarificationState] = useState<{
      isOpen: boolean;
      questions: string[]; // Changed to array
      pendingType: 'quote' | 'report';
      pendingArgs: any;
  }>({ isOpen: false, questions: [], pendingType: 'quote', pendingArgs: null });
  
  // Inicializa com dados da HidroClean se não houver nada salvo
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
      try {
        const stored = localStorage.getItem('userSettings');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      
      return {
        companyName: 'HidroClean Canalizações',
        companySlogan: 'Sistemas Hidráulicos, Diagnóstico Técnico e Remodelações',
        companyAddress: 'Rua das Fontaínhas, 51 2700-391 - Amadora',
        companyTaxId: '518050955',
        companyLogo: ''
      };
  });

  const reportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const storedQuotes = localStorage.getItem('savedQuotes');
      if (storedQuotes) setSavedQuotes(JSON.parse(storedQuotes));
      
      const storedReports = localStorage.getItem('savedReports');
      if (storedReports) setSavedReports(JSON.parse(storedReports));
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));
    } catch (e) {
      console.error("Failed to save quotes to localStorage", e);
    }
  }, [savedQuotes]);

  useEffect(() => {
    try {
      localStorage.setItem('savedReports', JSON.stringify(savedReports));
    } catch (e) {
      console.error("Failed to save reports to localStorage", e);
    }
  }, [savedReports]);

  useEffect(() => {
    try {
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
    } catch (e) {
        console.error("Failed to save settings to localStorage", e);
    }
  }, [userSettings]);

  // Function to generate sequential codes
  const getNextCode = useCallback((prefix: string, items: Array<{ code?: string }>) => {
      let maxNum = 0;
      items.forEach(item => {
          if (item.code && item.code.startsWith(prefix)) {
              const parts = item.code.split('-');
              const num = parseInt(parts[1], 10);
              if (!isNaN(num) && num > maxNum) {
                  maxNum = num;
              }
          }
      });
      return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  }, []);

  // --- Validation and Clarification Handlers ---
  const handleClarificationConfirm = (answer: string) => {
      const { pendingType, pendingArgs } = clarificationState;
      setClarificationState(prev => ({ ...prev, isOpen: false }));
      setPage('loading'); // Show loading again

      if (pendingType === 'quote') {
          const newDesc = `${pendingArgs.description}. Detalhe adicional do cliente: ${answer}`;
          handleGenerateQuote(newDesc, pendingArgs.city, pendingArgs.images, pendingArgs.selectedCurrency, pendingArgs.clientName, pendingArgs.clientAddress, pendingArgs.clientContact, true);
      } else {
           const newDesc = `${pendingArgs.description}. Detalhe adicional: ${answer}`;
           handleGenerateDirectReport(newDesc, pendingArgs.equipment, pendingArgs.images, pendingArgs.clientName, pendingArgs.clientAddress, pendingArgs.clientNif, pendingArgs.clientContact, pendingArgs.interestedParty, pendingArgs.technician, true);
      }
  };

  const handleClarificationCancel = () => {
      setClarificationState(prev => ({ ...prev, isOpen: false }));
      setPage(clarificationState.pendingType === 'quote' ? 'form' : 'report-form');
  };

  // --- Main Handlers ---

  const handleGenerateQuote = useCallback(async (description: string, city: string, images: File[], selectedCurrency: Currency, clientName: string, clientAddress: string, clientContact: string, skipValidation = false) => {
    setPage('loading');
    setError(null);
    
    // 1. Validate Description (if not skipped)
    if (!skipValidation) {
        const validation = await validateDescription(description);
        if (!validation.isValid && validation.questions && validation.questions.length > 0) {
            setClarificationState({
                isOpen: true,
                questions: validation.questions,
                pendingType: 'quote',
                pendingArgs: { description, city, images, selectedCurrency, clientName, clientAddress, clientContact }
            });
            return; // Stop here and wait for modal
        }
    }

    setCurrency(selectedCurrency);
    setCurrentImages(images); // Store images
    try {
      const result = await generateQuote(description, city, images, selectedCurrency, clientName);
      
      // Generate sequential code immediately
      const nextCode = getNextCode('ORC', savedQuotes);
      const uniqueId = new Date().toISOString() + Math.random();

      const newQuote: QuoteData = {
          ...result,
          id: uniqueId,
          code: nextCode,
          date: new Date().toISOString(),
          clientName, clientAddress, clientContact,
          executionTime: result.executionTime,
          paymentTerms: result.paymentTerms,
          status: 'pending' // Default status
      }
      setCurrentQuote(newQuote);
      
      // AUTO-SAVE: Save immediately to storage
      setSavedQuotes(prev => [newQuote, ...prev]);
      
      setPage('result');
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
      setError(`Falha ao gerar o orçamento: ${errorMessage}`);
      setPage('form');
    }
  }, [savedQuotes, getNextCode]);
  
  const handleGenerateDirectReport = useCallback(async (description: string, equipment: string, images: File[], clientName: string, clientAddress: string, clientNif: string, clientContact: string, interestedParty: string, technician: string, skipValidation = false) => {
      setPage('loading');
      setError(null);
      
      // 1. Validate Description (if not skipped)
      if (!skipValidation) {
          const validation = await validateDescription(description);
          if (!validation.isValid && validation.questions && validation.questions.length > 0) {
              setClarificationState({
                  isOpen: true,
                  questions: validation.questions,
                  pendingType: 'report',
                  pendingArgs: { description, equipment, images, clientName, clientAddress, clientNif, clientContact, interestedParty, technician }
              });
              return; // Stop here
          }
      }

      setCurrentImages(images);
      
      // Convert images to Base64 immediately for storage
      let base64Images: string[] = [];
      try {
          base64Images = await Promise.all(images.map(fileToBase64));
      } catch (err) {
          console.error("Failed to convert images", err);
      }
      setCurrentImagePreviews(base64Images);

      try {
          const result = await generateDirectTechnicalReport(
              description, 
              equipment, 
              images, 
              clientName, 
              clientAddress, 
              clientNif,
              clientContact,
              interestedParty,
              technician,
              userSettings.companyName
          );
          
          const nextCode = getNextCode('REL', savedReports);
          const uniqueId = new Date().toISOString() + Math.random();
          
          const newReport: TechnicalReportData = {
              ...result,
              id: uniqueId,
              code: nextCode,
              images: base64Images // Store base64 images in the report
          };

          setCurrentReport(newReport);
          
          // AUTO-SAVE: Save immediately
          setSavedReports(prev => [newReport, ...prev]);
          
          setPage('report-view');
      } catch (e) {
          console.error(e);
          const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
          setError(`Falha ao gerar o laudo técnico: ${errorMessage}`);
          setPage('report-form');
      }
  }, [userSettings.companyName, savedReports, getNextCode]);

  const handleGoHome = useCallback(() => {
      setPage('home');
      setCurrentQuote(null);
      setCurrentReport(null);
      setError(null);
  }, []);

  const handleReset = useCallback(() => {
    setPage('form');
    setCurrentQuote(null);
    setCurrentReport(null);
    setCurrentImages([]);
    setCurrentImagePreviews([]);
    setError(null);
  }, []);
  
  const handleResetReport = useCallback(() => {
      setPage('report-form');
      setCurrentReport(null);
      setCurrentImages([]);
      setCurrentImagePreviews([]);
      setError(null);
  }, []);

  // Function called by Manual Save button (redirects to history)
  const handleSaveQuote = useCallback((finalQuote: QuoteData) => {
    // Logic here is actually "Save and Close" since auto-save handles persistence
    setPage('history');
  }, []);

  // Function called by Auto-Save in QuoteResult (updates storage silently)
  const handleAutoSaveQuote = useCallback((updatedQuote: QuoteData) => {
      setSavedQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
  }, []);
  
  const handleUpdateQuoteStatus = useCallback((id: string, status: 'pending' | 'accepted' | 'rejected') => {
      setSavedQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  }, []);

  const handleSaveReport = useCallback(async () => {
      // Manual save/close action
      alert('Laudo salvo com sucesso!');
      setPage('history');
  }, []);

  // Function called by Auto-Save in TechnicalReport
  const handleAutoSaveReport = useCallback((updatedReport: TechnicalReportData) => {
      setCurrentReport(updatedReport); // Update view
      // Update storage if it exists
      if (updatedReport.id) {
          setSavedReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
      }
  }, []);

  // Special Handler: When QuoteResult generates a report linked to the quote
  const handleReportGeneratedFromQuote = useCallback((report: TechnicalReportData) => {
      // Determine the code based on linkage
      let finalCode = report.code;
      
      // If report came from quote with code ORC-XXX, try to make report LAU-XXX
      if (report.relatedQuoteCode) {
          const quoteNum = report.relatedQuoteCode.split('-')[1];
          if (quoteNum) {
              finalCode = `LAU-${quoteNum}`;
          }
      }
      
      // If no code yet (or failed linkage logic), generate sequential
      if (!finalCode) {
          finalCode = getNextCode('LAU', savedReports);
      }

      // IMPORTANT: Use ID if already exists (from QuoteResult), otherwise generate new
      const uniqueId = report.id || (new Date().toISOString() + Math.random());
      
      const finalReport = { ...report, id: uniqueId, code: finalCode };
      
      setCurrentReport(finalReport);
      setSavedReports(prev => [finalReport, ...prev]);
  }, [savedReports, getNextCode]);


  const handleUpdateQuote = useCallback((updatedQuote: QuoteData) => {
    // For "View Saved" mode, this acts as "Save and Return"
    setSavedQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
    setPage('history');
  }, []);
  
  const handleSaveSettings = useCallback((newSettings: UserSettings) => {
    setUserSettings(newSettings);
  }, []);

  const handleDeleteQuote = useCallback((id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este orçamento?')) {
        setSavedQuotes(prev => prev.filter(quote => quote.id !== id));
    }
  }, []);

  const handleDeleteReport = useCallback((id: string) => {
      if (window.confirm('Tem certeza que deseja deletar este laudo?')) {
          setSavedReports(prev => prev.filter(r => r.id !== id));
      }
  }, []);

  const handleViewQuote = useCallback((id: string) => {
    const quoteToView = savedQuotes.find(q => q.id === id);
    if (quoteToView) {
        setCurrentQuote(quoteToView);
        setCurrentImages([]); // Images not available from local storage history
        setPage('view');
    }
  }, [savedQuotes]);

  const handleViewReport = useCallback((id: string) => {
      const reportToView = savedReports.find(r => r.id === id);
      if (reportToView) {
          setCurrentReport(reportToView);
          // Restore images from Base64 stored in report
          if (reportToView.images) {
              setCurrentImagePreviews(reportToView.images);
          } else {
              setCurrentImagePreviews([]);
          }
          setPage('report-view');
      }
  }, [savedReports]);

  // Report Logic for Direct Mode
  const handleAddImageToReport = async (file: File) => {
      try {
          const base64 = await fileToBase64(file);
          setCurrentImagePreviews(prev => [...prev, base64]);
          
          // If we have a File array (only during creation), update it too
          if (currentImages.length > 0) {
              setCurrentImages(prev => [...prev, file]);
          }
      } catch (err) {
          console.error("Error processing image", err);
      }
  };

  const handleRemoveImageFromReport = (index: number) => {
      // Remove from previews (Base64)
      const newPreviews = currentImagePreviews.filter((_, i) => i !== index);
      setCurrentImagePreviews(newPreviews);
      
      // Remove from File array if exists
      if (currentImages.length > index) {
           setCurrentImages(prev => prev.filter((_, i) => i !== index));
      }
      
      if (currentReport) {
           const newPhotoAnalysis = currentReport.photoAnalysis.filter(p => p.photoIndex !== index)
            .map(p => ({...p, photoIndex: p.photoIndex > index ? p.photoIndex - 1 : p.photoIndex}));
           
           const updatedReport = {
               ...currentReport, 
               photoAnalysis: newPhotoAnalysis,
               images: newPreviews // Sync images in report object
           };
           handleAutoSaveReport(updatedReport);
      }
  };
  
  const handleAutoDescribeImage = async (index: number) => {
      let fileToAnalyze: File | undefined = currentImages[index];
      
      if (!fileToAnalyze) {
           const base64 = currentImagePreviews[index];
           if (base64) {
               try {
                   const res = await fetch(base64);
                   const blob = await res.blob();
                   fileToAnalyze = new File([blob], "image.jpg", { type: "image/jpeg" });
               } catch (e) {
                   console.error("Failed to rebuild file from base64", e);
               }
           }
      }

      if (!fileToAnalyze) return null;

      try {
          const analysis = await analyzeImageForReport(fileToAnalyze);
          return analysis;
      } catch (e) {
          console.error("Error describing image", e);
          return null;
      }
  };

  const handleDownloadReportPdf = useCallback(async () => {
      setIsPrintingReport(true);
      
      setTimeout(async () => {
        if (reportRef.current) {
             const input = reportRef.current;
             
            const originalWidth = input.style.width;
            const originalMinWidth = input.style.minWidth;
            
            input.style.width = '800px';
            input.style.minWidth = '800px';

            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const margin = 10;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const usableWidth = pdfWidth - margin * 2;
            
            const sections = Array.from(input.querySelectorAll('.pdf-section')) as HTMLElement[];
            
            let cursorY = margin;

            const canvasOptions = {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1200,
            };

            for (const section of sections) {
              if (section.classList.contains('break-before-page')) {
                 if (cursorY > margin) {
                     pdf.addPage();
                     cursorY = margin;
                 }
              }

              const canvas = await html2canvas(section, canvasOptions);
              const imgData = canvas.toDataURL('image/png');
              const imgWidth = canvas.width;
              const imgHeight = canvas.height;
              
              const ratio = usableWidth / imgWidth;
              const pdfImageHeight = imgHeight * ratio;

              if (cursorY + pdfImageHeight > pdfHeight - margin) {
                pdf.addPage();
                cursorY = margin;
              }

              pdf.addImage(imgData, 'PNG', margin, cursorY, usableWidth, pdfImageHeight);
              cursorY += pdfImageHeight + 3;
            }
            
            input.style.width = originalWidth;
            input.style.minWidth = originalMinWidth;

            pdf.save(`${currentReport?.code || 'laudo'}_${currentReport?.clientInfo.name.replace(/\s/g, '_')}.pdf`);
            setIsPrintingReport(false);
        }
      }, 800);
  }, [currentReport]);


  const renderContent = () => {
    switch (page) {
      case 'home':
          return <LandingPage onNavigate={setPage} />;
      case 'loading':
        return <LoadingSpinner />;
      case 'result':
      case 'view':
        return currentQuote ? (
          <QuoteResult
            key={currentQuote.id}
            quote={currentQuote} 
            userSettings={userSettings}
            images={currentImages} 
            onReset={handleReset} 
            onSaveOrUpdate={page === 'result' ? handleSaveQuote : handleUpdateQuote}
            onAutoSave={handleAutoSaveQuote}
            isViewingSaved={page === 'view'}
            onReportGenerated={handleReportGeneratedFromQuote}
            onReportUpdate={handleAutoSaveReport} // PASS AUTO-SAVE FOR REPORTS
          />
        ) : null;
      case 'report-form':
        return <ReportInputForm onSubmit={handleGenerateDirectReport} isLoading={false} />;
      case 'report-view':
        return currentReport ? (
             <div className="animate-fade-in">
                 <div className="flex justify-end mb-4 gap-2 flex-wrap">
                     <button onClick={handleResetReport} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition">Novo Laudo</button>
                     <button onClick={handleSaveReport} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Finalizar e Sair
                     </button>
                     <button onClick={handleDownloadReportPdf} className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-primary rounded-md shadow-sm transition flex items-center">
                        <UploadIcon className="h-4 w-4 mr-2 rotate-180" /> 
                        Baixar PDF
                     </button>
                 </div>
                 <div ref={reportRef}>
                    <TechnicalReport 
                        data={currentReport} 
                        onUpdate={handleAutoSaveReport}
                        userSettings={userSettings}
                        images={currentImagePreviews}
                        isPrinting={isPrintingReport}
                        onAddImage={handleAddImageToReport}
                        onRemoveImage={handleRemoveImageFromReport}
                        onAutoDescribe={handleAutoDescribeImage}
                    />
                 </div>
             </div>
        ) : null;
      case 'history':
        return <QuoteHistory 
                  quotes={savedQuotes} 
                  reports={savedReports}
                  onNewQuote={handleReset} 
                  onNewReport={handleResetReport}
                  onViewQuote={handleViewQuote} 
                  onViewReport={handleViewReport}
                  onDeleteQuote={handleDeleteQuote} 
                  onDeleteReport={handleDeleteReport}
                  onUpdateQuoteStatus={handleUpdateQuoteStatus}
                />;
      case 'settings':
        return <UserSettingsForm settings={userSettings} onSave={handleSaveSettings} />;
      case 'form':
      default:
        return <QuoteInputForm onSubmit={handleGenerateQuote} isLoading={false} currency={currency} setCurrency={setCurrency} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-4xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center cursor-pointer" onClick={handleGoHome}>
            <LogoIcon className="h-10 w-10 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-primary ml-3">IAO</h1>
        </div>
        <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 justify-center sm:justify-end">
            {page !== 'home' && (
                <button onClick={handleGoHome} className="flex items-center text-primary font-semibold hover:text-secondary transition whitespace-nowrap" title="Início">
                    <span className="hidden sm:inline">Início</span>
                </button>
            )}
            {page !== 'form' && page !== 'loading' && page !== 'home' && (
                 <button onClick={handleReset} className="flex items-center text-primary font-semibold hover:text-secondary transition whitespace-nowrap" title="Novo Orçamento">
                    <PencilIcon className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">Orçamento</span>
                </button>
            )}
             {page !== 'report-form' && page !== 'loading' && page !== 'home' && (
                 <button onClick={handleResetReport} className="flex items-center text-primary font-semibold hover:text-secondary transition whitespace-nowrap" title="Novo Laudo Técnico">
                    <ClipboardDocumentIcon className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">Novo Laudo</span>
                </button>
            )}
            {page !== 'history' && page !== 'home' && (
                <button onClick={() => setPage('history')} className="flex items-center text-primary font-semibold hover:text-secondary transition whitespace-nowrap" title="Ver Meus Orçamentos">
                    <HistoryIcon className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">Histórico</span>
                </button>
            )}
            <button onClick={() => setPage('settings')} className="flex items-center text-primary font-semibold hover:text-secondary transition whitespace-nowrap" title="Configurações">
                <CogIcon className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Ajustes</span>
            </button>
        </nav>
      </header>
      
      <main className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 sm:p-8 min-h-[500px] relative">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
            <p className="font-bold">Erro</p>
            <p>{error}</p>
          </div>
        )}
        {renderContent()}
        
        {/* Clarification Modal */}
        <ClarificationModal 
            isOpen={clarificationState.isOpen}
            questions={clarificationState.questions}
            onConfirm={handleClarificationConfirm}
            onCancel={handleClarificationCancel}
        />
      </main>

      <footer className="w-full max-w-4xl mt-8 text-center text-gray-500 text-sm space-y-1">
        <p>&copy; {new Date().getFullYear()} IA Desenvolvida por <span className="font-semibold text-gray-600">Mateus Parma</span> e <span className="font-semibold text-gray-600">Deborah Aureliano</span>.</p>
        <p className="text-xs opacity-70">Orçamento Inteligente AI - Todos os direitos reservados. <span className="font-mono bg-gray-200 px-1 rounded ml-1">{APP_VERSION}</span></p>
      </footer>
    </div>
  );
};

export default App;
