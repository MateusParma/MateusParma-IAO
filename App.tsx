
import React, { useState, useCallback, useEffect } from 'react';
import type { QuoteData, Currency, UserSettings, TechnicalReportData, WarrantyData, ReceiptData } from './types';
import { QuoteInputForm } from './components/QuoteInputForm';
import { ReceiptInputForm } from './components/ReceiptInputForm';
import { QuoteResult } from './components/QuoteResult';
import { ReceiptResult } from './components/ReceiptResult';
import { LoadingSpinner } from './components/LoadingSpinner';
import { QuoteHistory } from './components/QuoteHistory';
import { generateQuote, generateWarrantyTerm, generateReceipt } from './services/geminiService';
import { HistoryIcon, PencilIcon, CogIcon, ClipboardDocumentIcon, CheckCircleIcon, GlobeIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon, UploadIcon } from './components/AppIcons';
import { ConsultantPage } from './components/ConsultantPage';
import { 
  fetchQuotes, saveQuoteToDb, deleteQuoteFromDb, 
  fetchReports, saveReportToDb, deleteReportFromDb,
  fetchWarranties, saveWarrantyToDb, deleteWarrantyFromDb,
  fetchReceipts, saveReceiptToDb, deleteReceiptFromDb,
  fetchSettings, saveSettingsToDb
} from './services/supabaseService';

type Page = 'home' | 'form' | 'report-form' | 'warranty-form' | 'receipt-form' | 'loading' | 'result' | 'report-view' | 'warranty-view' | 'receipt-view' | 'history' | 'view' | 'settings' | 'consultant';

const HIDROCLEAN_LOGO_URL = "https://github.com/MateusParma/nexgenimages/blob/main/hidroclean%20logo.png?raw=true";

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
            <img src={HIDROCLEAN_LOGO_URL} className="h-32 w-auto object-contain" alt="HidroClean Logo" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            IA de Orçamentos
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed">
            Crie orçamentos detalhados, laudos técnicos, termos de garantia e recibos profissionais em segundos. Seus dados são salvos no seu navegador.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl px-4">
            <button onClick={() => onNavigate('form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-primary rounded-xl shadow-sm hover:shadow-xl hover:bg-blue-50 transition group transform hover:-translate-y-1">
                <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><PencilIcon className="h-8 w-8 text-primary" /></div>
                <span className="text-lg font-bold text-gray-800">Orçamento</span>
            </button>

            <button onClick={() => onNavigate('report-form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-xl hover:border-secondary transition group transform hover:-translate-y-1">
                <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><ClipboardDocumentIcon className="h-8 w-8 text-gray-600 group-hover:text-secondary" /></div>
                <span className="text-lg font-bold text-gray-800">Laudo Técnico</span>
            </button>

            <button onClick={() => onNavigate('warranty-form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-green-200 rounded-xl shadow-sm hover:shadow-xl hover:border-green-500 transition group transform hover:-translate-y-1">
                <div className="bg-green-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><ShieldCheckIcon className="h-8 w-8 text-green-600" /></div>
                <span className="text-lg font-bold text-gray-800">Garantia</span>
            </button>

            <button onClick={() => onNavigate('receipt-form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-purple-200 rounded-xl shadow-sm hover:shadow-xl hover:border-purple-500 transition group transform hover:-translate-y-1">
                <div className="bg-purple-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><ClipboardDocumentIcon className="h-8 w-8 text-purple-600" /></div>
                <span className="text-lg font-bold text-gray-800">Recibo</span>
            </button>
        </div>

        <div className="mt-8 w-full max-w-4xl px-4">
            <button onClick={() => onNavigate('consultant')} className="w-full flex items-center justify-center p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 group">
                 <ChatBubbleLeftRightIcon className="h-6 w-6 mr-3 text-blue-300 group-hover:text-white transition" />
                 <div className="text-left">
                     <span className="block font-bold text-lg">Consultor Empresarial IA</span>
                     <span className="block text-xs text-gray-400">Tire dúvidas sobre Leis PT, Contabilidade e Franchising</span>
                 </div>
            </button>
        </div>
        
        <div className="mt-8 mb-8">
             <button onClick={() => onNavigate('history')} className="flex items-center text-gray-500 hover:text-primary transition">
                <HistoryIcon className="h-5 w-5 mr-2" /> Acessar Histórico Salvo
            </button>
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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, profile: 'hidroClean' | 'gilmarRocha') => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            setLocalSettings(prev => ({
                ...prev,
                savedLogos: { ...prev.savedLogos, [profile]: base64 }
            }));
        }
    };
    
    const applyProfile = (profile: 'pt' | 'br') => {
        if (profile === 'pt') {
            setLocalSettings(prev => ({
                ...prev,
                companyName: 'HidroClean Canalizações',
                companySlogan: 'Sistemas Hidráulicos, Diagnóstico Técnico e Remodelações',
                companyAddress: 'Rua das Fontaínhas, 51 2700-391 - Amadora, Portugal',
                companyTaxId: '518050955',
                companyLogo: prev.savedLogos?.hidroClean || HIDROCLEAN_LOGO_URL 
            }));
        } else {
            setLocalSettings(prev => ({
                ...prev,
                companyName: 'Gilmar Rocha Construções',
                companySlogan: 'Reformas, Construção Civil e Acabamentos',
                companyAddress: 'Av. Paulista, 1000 - São Paulo, SP - Brasil',
                companyTaxId: '12.345.678/0001-90',
                companyLogo: prev.savedLogos?.gilmarRocha || prev.companyLogo 
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      await onSave(localSettings);
      setIsSaving(false);
      alert("Configurações salvas localmente!");
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-10">
        <div className="flex flex-col gap-2">
             <h2 className="text-2xl font-bold text-gray-800">Ajustes do Profissional</h2>
             <p className="text-sm text-gray-500">Configure os dados da sua empresa para os documentos.</p>
        </div>
        
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center">
                <GlobeIcon className="h-4 w-4 mr-2" /> PERFIS E LOGOS
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-2">HidroClean (PT)</h4>
                    <div className="mb-4 w-full h-24 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                        {(localSettings.savedLogos?.hidroClean || (localSettings.companyName.includes('HidroClean') && localSettings.companyLogo)) ? (
                            <img src={localSettings.savedLogos?.hidroClean || localSettings.companyLogo} className="h-full object-contain" alt="Logo HidroClean" />
                        ) : <span className="text-[10px] text-gray-400">Sem Logo</span>}
                    </div>
                    <label className="w-full mb-3 cursor-pointer">
                        <span className="block w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition">Mudar Logo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'hidroClean')} />
                    </label>
                    <button type="button" onClick={() => applyProfile('pt')} className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-4 w-4" /> Aplicar Perfil
                    </button>
                </div>

                <div className="bg-white border-2 border-green-100 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-2">Gilmar Rocha (BR)</h4>
                    <div className="mb-4 w-full h-24 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                        {localSettings.savedLogos?.gilmarRocha ? (
                            <img src={localSettings.savedLogos.gilmarRocha} className="h-full object-contain" alt="Logo Gilmar Rocha" />
                        ) : <span className="text-[10px] text-gray-400">Sem Logo</span>}
                    </div>
                    <label className="w-full mb-3 cursor-pointer">
                        <span className="block w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition">Mudar Logo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'gilmarRocha')} />
                    </label>
                    <button type="button" onClick={() => applyProfile('br')} className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
                        <CheckCircleIcon className="h-4 w-4" /> Aplicar Perfil
                    </button>
                </div>
            </div>
        </div>

        <div className="space-y-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 gap-6">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nome da Empresa Ativa</label>
                <input type="text" name="companyName" value={localSettings.companyName} onChange={handleInputChange} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Endereço Fiscal</label>
                <input type="text" name="companyAddress" value={localSettings.companyAddress} onChange={handleInputChange} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">NIF / CNPJ Ativo</label>
                <input type="text" name="companyTaxId" value={localSettings.companyTaxId} onChange={handleInputChange} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSaving} className="w-full py-5 bg-primary text-white rounded-2xl shadow-lg text-lg font-bold hover:bg-secondary transition-all transform active:scale-[0.98]">
          {isSaving ? 'A gravar...' : 'Salvar Alterações'}
        </button>
      </form>
    );
};

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [currentReport, setCurrentReport] = useState<TechnicalReportData | null>(null);
  const [currentWarranty, setCurrentWarranty] = useState<WarrantyData | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(null);
  const [currentImages, setCurrentImages] = useState<File[]>([]); 
  const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([]);
  const [savedReports, setSavedReports] = useState<TechnicalReportData[]>([]);
  const [savedWarranties, setSavedWarranties] = useState<WarrantyData[]>([]);
  const [savedReceipts, setSavedReceipts] = useState<ReceiptData[]>([]);
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [loadingData, setLoadingData] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>({
        companyName: 'HidroClean Canalizações',
        companySlogan: 'Sistemas Hidráulicos e Remodelações',
        companyAddress: 'Rua das Fontaínhas, 51 - Amadora',
        companyTaxId: '518050955',
        companyLogo: HIDROCLEAN_LOGO_URL,
        savedLogos: { hidroClean: HIDROCLEAN_LOGO_URL } 
  });

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [quotes, reports, warranties, receipts, settings] = await Promise.all([
          fetchQuotes(), fetchReports(), fetchWarranties(), fetchReceipts(), fetchSettings()
        ]);
        setSavedQuotes(quotes); setSavedReports(reports); setSavedWarranties(warranties); setSavedReceipts(receipts);
        if (settings) setUserSettings(settings);
      } finally { setLoadingData(false); }
    };
    loadData();
  }, []);

  const handleGoHome = useCallback(() => { setPage('home'); setCurrentQuote(null); setCurrentReport(null); setCurrentWarranty(null); setCurrentReceipt(null); }, []);
  const handleReset = useCallback(() => { setPage('form'); setCurrentQuote(null); setCurrentImages([]); }, []);
  const handleResetReceipt = useCallback(() => { setPage('receipt-form'); setCurrentReceipt(null); }, []);

  const handleGenerateQuote = useCallback((d:string, c:string, im:File[], cu:Currency, cn:string, ca:string, co:string, inc:boolean) => {
    setPage('loading');
    generateQuote(d,c,im,cu,cn,inc).then(r => {
      const nq = {...r, id:crypto.randomUUID(), code:`ORC-${savedQuotes.length+1}`, date:new Date().toISOString(), clientName:cn, clientAddress:ca, clientContact:co};
      setCurrentQuote(nq); saveQuoteToDb(nq); setSavedQuotes(p=>[nq,...p]); setPage('result');
    });
  }, [savedQuotes.length]);

  const handleGenerateReceiptAction = (cn:string, ni:string, am:number, de:string, cu:Currency, pm: string) => {
    setPage('loading');
    generateReceipt(cn, am, de, cu).then(r => {
        const nr: ReceiptData = { 
            id: crypto.randomUUID(), 
            code: `REC-${savedReceipts.length+1}`, 
            date: new Date().toLocaleDateString('pt-BR'),
            clientName: cn, clientNif: ni, amount: am, currency: cu, description: r.description || de, paymentMethod: pm || r.paymentMethod || "Transferência Bancária"
        };
        setCurrentReceipt(nr); saveReceiptToDb(nr); setSavedReceipts(p=>[nr, ...p]); setPage('receipt-view');
    });
  };

  const renderContent = () => {
    if (loadingData) return <LoadingSpinner />;
    switch (page) {
      case 'home': return <LandingPage onNavigate={setPage} />;
      case 'loading': return <LoadingSpinner />;
      case 'consultant': return <ConsultantPage userSettings={userSettings} />;
      case 'result': case 'view': return currentQuote ? <QuoteResult quote={currentQuote} userSettings={userSettings} images={currentImages} onReset={handleReset} onSaveOrUpdate={(q) => {saveQuoteToDb(q); setPage('history');}} onAutoSave={(q) => {saveQuoteToDb(q); setSavedQuotes(p=>p.map(x=>x.id===q.id?q:x));}} isViewingSaved={page === 'view'} onGenerateWarranty={(q) => {setPage('loading'); generateWarrantyTerm(q.clientName, "", q.clientAddress, q.title, userSettings.companyName).then(w => {const finalW = {...w, id: crypto.randomUUID(), code: `GAR-${savedWarranties.length+1}`}; saveWarrantyToDb(finalW); setSavedWarranties(p=>[finalW, ...p]); setCurrentWarranty(finalW); setPage('warranty-view');});}} onGenerateReceipt={(q) => { 
        const total = q.steps.reduce((acc, s) => acc + (s.userPrice * s.quantity * (1 + s.taxRate/100)), 0);
        handleGenerateReceiptAction(q.clientName, "", total, q.title, q.currency, "Transferência Bancária");
      }} /> : null;
      case 'receipt-form': return <ReceiptInputForm onSubmit={handleGenerateReceiptAction} isLoading={false} currency={currency} setCurrency={setCurrency} />;
      case 'receipt-view': return currentReceipt ? <ReceiptResult data={currentReceipt} userSettings={userSettings} onReset={handleResetReceipt} onAutoSave={(r)=>{setCurrentReceipt(r); saveReceiptToDb(r); setSavedReceipts(p=>p.map(x=>x.id===r.id?r:x));}} /> : null;
      case 'settings': return <UserSettingsForm settings={userSettings} onSave={(s)=>{setUserSettings(s); saveSettingsToDb(s);}} />;
      case 'history': return <QuoteHistory quotes={savedQuotes} reports={savedReports} warranties={savedWarranties} onNewQuote={handleReset} onNewReport={() => setPage('report-form')} onViewQuote={(id)=>{const q=savedQuotes.find(x=>x.id===id); if(q){setCurrentQuote(q); setPage('view');}}} onViewReport={(id)=>{const r=savedReports.find(x=>x.id===id); if(r){setCurrentReport(r); setPage('report-view');}}} onViewWarranty={(id)=>{const w=savedWarranties.find(x=>x.id===id); if(w){setCurrentWarranty(w); setPage('warranty-view');}}} onDeleteQuote={(id)=>{deleteQuoteFromDb(id); setSavedQuotes(p=>p.filter(x=>x.id!==id));}} onDeleteReport={(id)=>{deleteReportFromDb(id); setSavedReports(p=>p.filter(x=>x.id!==id));}} onDeleteWarranty={(id)=>{deleteWarrantyFromDb(id); setSavedWarranties(p=>p.filter(x=>x.id!==id));}} onViewReceipt={(id)=>{const r=savedReceipts.find(x=>x.id===id); if(r){setCurrentReceipt(r); setPage('receipt-view');}}} onDeleteReceipt={(id)=>{deleteReceiptFromDb(id); setSavedReceipts(p=>p.filter(x=>x.id!==id));}} receipts={savedReceipts} />;
      case 'form': default: return <QuoteInputForm onSubmit={handleGenerateQuote} onScanImage={(f,d) => { alert('Digitalização automática em manutenção.'); }} isLoading={false} currency={currency} setCurrency={setCurrency} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-4xl mb-6 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center cursor-pointer group" onClick={handleGoHome}>
            <div className="p-1 bg-white rounded-xl shadow-lg transform group-hover:scale-110 transition flex items-center justify-center border border-gray-100 overflow-hidden h-10 w-10">
                <img src={HIDROCLEAN_LOGO_URL} className="h-full w-full object-contain" alt="Logo" />
            </div>
            <h1 className="text-3xl font-black text-primary ml-3 tracking-tighter">IAO</h1>
        </div>
        <nav className="flex items-center space-x-6">
            <button onClick={() => setPage('settings')} className="flex items-center justify-center gap-2 text-primary font-bold hover:text-secondary transition group h-10 px-3 rounded-xl hover:bg-white shadow-sm hover:shadow">
                <CogIcon className="h-6 w-6 flex-shrink-0" />
                <span className="hidden sm:inline">Ajustes</span>
            </button>
            <button onClick={() => setPage('history')} className="flex items-center justify-center gap-2 text-primary font-bold hover:text-secondary transition group h-10 px-3 rounded-xl hover:bg-white shadow-sm hover:shadow">
                <HistoryIcon className="h-6 w-6 flex-shrink-0" />
                <span className="hidden sm:inline">Histórico</span>
            </button>
        </nav>
      </header>
      <main className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 min-h-[600px] relative border border-gray-100">
        {renderContent()}
      </main>
      <footer className="mt-8 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          IAO Profissional • Inteligência Artificial para Orçamentos
      </footer>
    </div>
  );
};

export default App;
