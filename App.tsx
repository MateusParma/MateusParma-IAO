
import React, { useState, useCallback, useEffect } from 'react';
import type { QuoteData, Currency, UserSettings, TechnicalReportData } from './types';
import { QuoteInputForm } from './components/QuoteInputForm';
import { ReportInputForm } from './components/ReportInputForm';
import { QuoteResult } from './components/QuoteResult';
import { TechnicalReport } from './components/TechnicalReport';
import { LoadingSpinner } from './components/LoadingSpinner';
import { QuoteHistory } from './components/QuoteHistory';
import { generateQuote, generateDirectTechnicalReport, analyzeImageForReport } from './services/geminiService';
import { LogoIcon, HistoryIcon, PencilIcon, UploadIcon, CogIcon, ClipboardDocumentIcon, CheckCircleIcon } from './components/AppIcons';

// Make jspdf and html2canvas available in the scope (for Report only mode)
declare const jspdf: any;
declare const html2canvas: any;

type Page = 'form' | 'report-form' | 'loading' | 'result' | 'report-view' | 'history' | 'view' | 'settings';

// VERSÃO DO APLICATIVO
const APP_VERSION = "v1.6";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
};

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
        <div className="p-4 border border-gray-200 rounded-lg space-y-4">
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
            <label htmlFor="companyTaxId" className="block text-sm font-medium text-gray-700 mb-1">NIF / Contribuinte</label>
            <input type="text" id="companyTaxId" name="companyTaxId" value={localSettings.companyTaxId} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="999999999" />
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
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
  const [page, setPage] = useState<Page>('form');
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [currentReport, setCurrentReport] = useState<TechnicalReportData | null>(null);
  const [currentImages, setCurrentImages] = useState<File[]>([]); // Keep images in state
  const [currentImagePreviews, setCurrentImagePreviews] = useState<string[]>([]); // For report view
  
  const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([]);
  const [savedReports, setSavedReports] = useState<TechnicalReportData[]>([]);
  
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [error, setError] = useState<string | null>(null);
  const [isPrintingReport, setIsPrintingReport] = useState(false);
  
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

  const handleGenerateQuote = useCallback(async (description: string, city: string, images: File[], selectedCurrency: Currency, clientName: string, clientAddress: string, clientContact: string) => {
    setPage('loading');
    setError(null);
    setCurrency(selectedCurrency);
    setCurrentImages(images); // Store images
    try {
      const result = await generateQuote(description, city, images, selectedCurrency, clientName);
      
      // Generate sequential code temporarily (finalized on save)
      const nextCode = getNextCode('ORC', savedQuotes);

      const newQuote: QuoteData = {
          ...result,
          id: `temp-${Date.now()}`,
          code: nextCode,
          date: new Date().toISOString(),
          clientName, clientAddress, clientContact,
          executionTime: result.executionTime,
          paymentTerms: result.paymentTerms
      }
      setCurrentQuote(newQuote);
      setPage('result');
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
      setError(`Falha ao gerar o orçamento: ${errorMessage}`);
      setPage('form');
    }
  }, [savedQuotes, getNextCode]);
  
  const handleGenerateDirectReport = useCallback(async (description: string, equipment: string, images: File[], clientName: string, clientAddress: string, clientNif: string, clientContact: string, interestedParty: string, technician: string) => {
      setPage('loading');
      setError(null);
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
          
          const newReport: TechnicalReportData = {
              ...result,
              id: `temp-rep-${Date.now()}`,
              code: nextCode,
              images: base64Images // Store base64 images in the report
          };

          setCurrentReport(newReport);
          setPage('report-view');
      } catch (e) {
          console.error(e);
          const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
          setError(`Falha ao gerar o laudo técnico: ${errorMessage}`);
          setPage('report-form');
      }
  }, [userSettings.companyName, savedReports, getNextCode]);

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

  const handleSaveQuote = useCallback((finalQuote: QuoteData) => {
    // Ensure unique ID and Code if it's a new save
    const isNew = finalQuote.id.startsWith('temp-');
    const finalCode = isNew ? getNextCode('ORC', savedQuotes) : (finalQuote.code || getNextCode('ORC', savedQuotes));

    const newQuote: QuoteData = {
        ...finalQuote,
        id: isNew ? new Date().toISOString() + Math.random() : finalQuote.id,
        code: finalCode,
        date: finalQuote.date || new Date().toISOString(),
    };

    if (isNew) {
        setSavedQuotes(prev => [...prev, newQuote]);
    } else {
        setSavedQuotes(prev => prev.map(q => q.id === newQuote.id ? newQuote : q));
    }
    setPage('history');
  }, [savedQuotes, getNextCode]);

  const handleSaveReport = useCallback(async () => {
      if (!currentReport) return;

      const isNew = currentReport.id?.startsWith('temp-') || !currentReport.id;
      const finalCode = isNew ? getNextCode('REL', savedReports) : (currentReport.code || getNextCode('REL', savedReports));

      // Ensure we have the latest images saved in the report object
      const finalReportToSave: TechnicalReportData = {
          ...currentReport,
          id: isNew ? new Date().toISOString() + Math.random() : currentReport.id,
          code: finalCode,
          images: currentImagePreviews // Save current previews (which are base64)
      };

      if (isNew) {
          setSavedReports(prev => [...prev, finalReportToSave]);
      } else {
          setSavedReports(prev => prev.map(r => r.id === finalReportToSave.id ? finalReportToSave : r));
      }
      alert('Laudo salvo com sucesso! As fotos foram arquivadas.');
  }, [currentReport, savedReports, getNextCode, currentImagePreviews]);

  const handleUpdateQuote = useCallback((updatedQuote: QuoteData) => {
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
      setCurrentImagePreviews(prev => prev.filter((_, i) => i !== index));
      
      // Remove from File array if exists
      if (currentImages.length > index) {
           setCurrentImages(prev => prev.filter((_, i) => i !== index));
      }
      
      if (currentReport) {
           const newPhotoAnalysis = currentReport.photoAnalysis.filter(p => p.photoIndex !== index)
            .map(p => ({...p, photoIndex: p.photoIndex > index ? p.photoIndex - 1 : p.photoIndex}));
          setCurrentReport({...currentReport, photoAnalysis: newPhotoAnalysis});
      }
  };
  
  const handleAutoDescribeImage = async (index: number) => {
      // Need a File object for API. 
      // If we are in "creation" mode, we have 'currentImages'.
      // If in "view history" mode, we only have base64 in 'currentImagePreviews'.
      
      let fileToAnalyze: File | undefined = currentImages[index];
      
      if (!fileToAnalyze) {
           // Convert base64 back to blob if needed, or pass base64 to service
           // For simplicity, we only allow auto-describe if we have the File object (new session)
           // Or we could implement base64 handling in the service.
           // For now, let's try to rebuild a file from base64 string if possible
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
      
      // Increased timeout to ensure DOM updates and image loading before capture
      setTimeout(async () => {
        if (reportRef.current) {
             const input = reportRef.current;
             
             // Save original style
            const originalWidth = input.style.width;
            const originalMinWidth = input.style.minWidth;
            
            // Force desktop-like width for PDF to avoid mobile layout issues
            input.style.width = '800px';
            input.style.minWidth = '800px';

            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const margin = 10; // Reduced margin
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
              // Check if this section should force a page break
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

              // Check if content fits on current page
              if (cursorY + pdfImageHeight > pdfHeight - margin) {
                pdf.addPage();
                cursorY = margin;
              }

              pdf.addImage(imgData, 'PNG', margin, cursorY, usableWidth, pdfImageHeight);
              cursorY += pdfImageHeight + 3; // Small padding between sections
            }
            
            // Restore
            input.style.width = originalWidth;
            input.style.minWidth = originalMinWidth;

            pdf.save(`${currentReport?.code || 'laudo'}_${currentReport?.clientInfo.name.replace(/\s/g, '_')}.pdf`);
            setIsPrintingReport(false);
        }
      }, 800); // Increased to 800ms
  }, [currentReport]);


  const renderContent = () => {
    switch (page) {
      case 'loading':
        return <LoadingSpinner />;
      case 'result':
      case 'view':
        return currentQuote ? (
          <QuoteResult
            key={currentQuote.id}
            quote={currentQuote} 
            userSettings={userSettings}
            images={currentImages} // Pass images
            onReset={handleReset} 
            onSaveOrUpdate={page === 'result' ? handleSaveQuote : handleUpdateQuote}
            isViewingSaved={page === 'view'}
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
                        Salvar no Histórico
                     </button>
                     <button onClick={handleDownloadReportPdf} className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-primary rounded-md shadow-sm transition flex items-center">
                        <UploadIcon className="h-4 w-4 mr-2 rotate-180" /> 
                        Baixar PDF
                     </button>
                 </div>
                 <div ref={reportRef}>
                    <TechnicalReport 
                        data={currentReport} 
                        onUpdate={setCurrentReport}
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
        <div className="flex items-center cursor-pointer" onClick={handleReset}>
            <LogoIcon className="h-10 w-10 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-primary ml-3">IAO</h1>
        </div>
        <nav className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 justify-center sm:justify-end">
            {page !== 'form' && page !== 'loading' && (
                 <button onClick={handleReset} className="flex items-center text-primary font-semibold hover:text-secondary transition whitespace-nowrap" title="Novo Orçamento">
                    <PencilIcon className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">Orçamento</span>
                </button>
            )}
             {page !== 'report-form' && page !== 'loading' && (
                 <button onClick={handleResetReport} className="flex items-center text-primary font-semibold hover:text-secondary transition whitespace-nowrap" title="Novo Laudo Técnico">
                    <ClipboardDocumentIcon className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">Novo Laudo</span>
                </button>
            )}
            {page !== 'history' && (
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
      
      <main className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 sm:p-8 min-h-[500px]">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
            <p className="font-bold">Erro</p>
            <p>{error}</p>
          </div>
        )}
        {renderContent()}
      </main>

      <footer className="w-full max-w-4xl mt-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Orçamento Inteligente AI. Todos os direitos reservados. <span className="text-xs opacity-50 ml-2 font-mono bg-gray-200 px-1 rounded">{APP_VERSION}</span></p>
      </footer>
    </div>
  );
};

export default App;
