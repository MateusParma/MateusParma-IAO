
import React, { useState, useCallback, useEffect } from 'react';
import type { QuoteData, Currency, UserSettings, TechnicalReportData, WarrantyData, ReceiptData, DiscountVoucherData } from './types';
import { QuoteInputForm } from './components/QuoteInputForm';
import { ReceiptInputForm } from './components/ReceiptInputForm';
import { DiscountVoucherForm } from './components/DiscountVoucherForm';
import { QuoteResult } from './components/QuoteResult';
import { ReceiptResult } from './components/ReceiptResult';
import { DiscountVoucherResult } from './components/DiscountVoucherResult';
import { LoadingSpinner } from './components/LoadingSpinner';
import { WarrantyInputForm } from './components/WarrantyInputForm';
import { WarrantyResult } from './components/WarrantyResult';
import { ReportInputForm } from './components/ReportInputForm';
import { TechnicalReport } from './components/TechnicalReport';
import { LoginPage } from './components/LoginPage';
import { HistoryPage } from './components/HistoryPage';
import { generateQuote, generateWarrantyTerm, generateReceipt, generateDirectTechnicalReport, analyzeImageForReport } from './services/geminiService';
import { HistoryIcon, PencilIcon, CogIcon, ClipboardDocumentIcon, CheckCircleIcon, GlobeIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon, UploadIcon, SparklesIcon } from './components/AppIcons';
import { ConsultantPage } from './components/ConsultantPage';
import { 
  fetchSettings, 
  saveQuoteToDb, 
  saveReportToDb, 
  saveWarrantyToDb, 
  saveReceiptToDb,
  saveVoucherToDb
} from './services/supabaseService';

type Page = 'home' | 'form' | 'report-form' | 'warranty-form' | 'receipt-form' | 'discount-form' | 'loading' | 'result' | 'report-view' | 'warranty-view' | 'receipt-view' | 'discount-view' | 'history' | 'settings' | 'consultant';

const HIDROCLEAN_LOGO_URL = "https://github.com/MateusParma/nexgenimages/blob/main/hidroclean%20logo.png?raw=true";

const LandingPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in text-center">
        <div className="mb-8 transform hover:scale-105 transition duration-500">
            <img src={HIDROCLEAN_LOGO_URL} className="h-32 w-auto object-contain" alt="HidroClean Logo" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            IA de Orçamentos
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed">
            Gestão profissional de documentos para serviços hidráulicos e obras.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl px-4">
            <button onClick={() => onNavigate('form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-primary rounded-xl shadow-sm hover:shadow-xl hover:bg-blue-50 transition group transform hover:-translate-y-1">
                <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><PencilIcon className="h-8 w-8 text-primary" /></div>
                <span className="text-lg font-bold text-gray-800">Orçamento</span>
            </button>

            <button onClick={() => onNavigate('discount-form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-orange-200 rounded-xl shadow-sm hover:shadow-xl hover:border-orange-500 transition group transform hover:-translate-y-1">
                <div className="bg-orange-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><SparklesIcon className="h-8 w-8 text-orange-600" /></div>
                <span className="text-lg font-bold text-gray-800">Vale Desconto</span>
            </button>

            <button onClick={() => onNavigate('receipt-form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-purple-200 rounded-xl shadow-sm hover:shadow-xl hover:border-purple-500 transition group transform hover:-translate-y-1">
                <div className="bg-purple-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><ClipboardDocumentIcon className="h-8 w-8 text-purple-600" /></div>
                <span className="text-lg font-bold text-gray-800">Recibo</span>
            </button>
            
            <button onClick={() => onNavigate('report-form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-xl hover:border-secondary transition group transform hover:-translate-y-1">
                <div className="bg-gray-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><ClipboardDocumentIcon className="h-8 w-8 text-gray-600 group-hover:text-secondary" /></div>
                <span className="text-lg font-bold text-gray-800">Laudo Técnico</span>
            </button>

            <button onClick={() => onNavigate('warranty-form')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-green-200 rounded-xl shadow-sm hover:shadow-xl hover:border-green-500 transition group transform hover:-translate-y-1">
                <div className="bg-green-100 p-3 rounded-full mb-3 group-hover:bg-white transition"><ShieldCheckIcon className="h-8 w-8 text-green-600" /></div>
                <span className="text-lg font-bold text-gray-800">Garantia</span>
            </button>
            
            <button onClick={() => onNavigate('consultant')} className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                 <ChatBubbleLeftRightIcon className="h-8 w-8 mb-3 text-blue-300" />
                 <span className="text-lg font-bold">Consultor IA</span>
            </button>
        </div>
    </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [page, setPage] = useState<Page>('home');
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [currentReport, setCurrentReport] = useState<TechnicalReportData | null>(null);
  const [currentWarranty, setCurrentWarranty] = useState<WarrantyData | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(null);
  const [currentVoucher, setCurrentVoucher] = useState<DiscountVoucherData | null>(null);
  const [quoteImages, setQuoteImages] = useState<File[]>([]);
  const [reportImages, setReportImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [loadingData, setLoadingData] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>({
        companyName: 'HidroClean Canalizações',
        companySlogan: 'Sistemas Hidráulicos e Remodelações',
        companyAddress: 'Rua das Fontaínhas, 51 - Amadora',
        companyTaxId: '518050955',
        companyLogo: HIDROCLEAN_LOGO_URL,
  });

  useEffect(() => {
    const sessionActive = localStorage.getItem('_iao_session_active');
    if (sessionActive === 'true') setIsAuthenticated(true);

    const loadData = async () => {
      setLoadingData(true);
      try {
        const settings = await fetchSettings();
        if (settings) setUserSettings(settings);
      } finally { setLoadingData(false); }
    };
    loadData();
  }, []);

  const handleQuoteSubmit = async (desc: string, city: string, images: File[], curr: Currency, name: string, addr: string, contact: string, detail: boolean) => {
    setIsLoading(true);
    setPage('loading');
    setQuoteImages(images);
    try {
      const data = await generateQuote(desc, city, images, curr, name, detail);
      const newQuote: QuoteData = {
        ...data,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        clientName: name,
        clientAddress: addr,
        clientContact: contact,
        code: `ORC-${Math.floor(Math.random() * 10000)}`
      };
      setCurrentQuote(newQuote);
      saveQuoteToDb(newQuote);
      setPage('result');
    } catch (e) {
      alert("Erro ao gerar orçamento.");
      setPage('form');
    } finally { setIsLoading(false); }
  };

  const handleReportSubmit = async (desc: string, equip: string, images: File[], name: string, addr: string, nif: string, contact: string, party: string, tech: string) => {
    setIsLoading(true);
    setPage('loading');
    try {
      const imageUrls = images.map(img => URL.createObjectURL(img));
      setReportImages(imageUrls);
      const data = await generateDirectTechnicalReport(desc, equip, images, name, addr, nif, contact, party, tech, userSettings.companyName);
      const finalReport = { ...data, id: crypto.randomUUID(), code: `LDT-${Math.floor(Math.random() * 10000)}` };
      setCurrentReport(finalReport);
      saveReportToDb(finalReport);
      setPage('report-view');
    } catch (e) {
      alert("Erro ao gerar laudo.");
      setPage('report-form');
    } finally { setIsLoading(false); }
  };

  const handleWarrantySubmit = async (name: string, nif: string, addr: string, desc: string) => {
    setIsLoading(true);
    setPage('loading');
    try {
      const data = await generateWarrantyTerm(name, nif, addr, desc, userSettings.companyName);
      const finalWarranty = { ...data, id: crypto.randomUUID(), code: `GAR-${Math.floor(Math.random() * 10000)}` };
      setCurrentWarranty(finalWarranty);
      saveWarrantyToDb(finalWarranty);
      setPage('warranty-view');
    } catch (e) {
      alert("Erro ao gerar garantia.");
      setPage('warranty-form');
    } finally { setIsLoading(false); }
  };

  const handleReceiptSubmit = async (name: string, nif: string, amount: number, desc: string, curr: Currency, method: string) => {
    setIsLoading(true);
    setPage('loading');
    try {
      const data = await generateReceipt(name, amount, desc, curr);
      const newReceipt: ReceiptData = {
        id: crypto.randomUUID(),
        code: `REC-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toLocaleDateString('pt-PT'),
        clientName: data.clientName || name,
        clientNif: nif,
        amount: data.amount || amount,
        currency: data.currency as Currency || curr,
        description: data.description || desc,
        paymentMethod: method
      };
      setCurrentReceipt(newReceipt);
      saveReceiptToDb(newReceipt);
      setPage('receipt-view');
    } catch (e) {
      alert("Erro ao gerar recibo.");
      setPage('receipt-form');
    } finally { setIsLoading(false); }
  };

  const handleGenerateVoucherAction = (data: any) => {
      const nv: DiscountVoucherData = {
          id: crypto.randomUUID(),
          code: `DSC-${Math.floor(Math.random() * 10000)}`,
          date: new Date().toLocaleDateString('pt-PT'),
          ...data,
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-PT')
      };
      setCurrentVoucher(nv);
      saveVoucherToDb(nv);
      setPage('discount-view');
  };

  const NavItem: React.FC<{ target: Page; icon: React.ReactNode; label: string }> = ({ target, icon, label }) => (
    <button 
        onClick={() => setPage(target)} 
        className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all ${page === target ? 'bg-primary text-white shadow-lg scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
    >
        <div className="mb-1">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );

  if (!isAuthenticated) return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;

  const renderContent = () => {
    if (loadingData) return <LoadingSpinner />;
    switch (page) {
      case 'home': return <LandingPage onNavigate={setPage} />;
      case 'loading': return <LoadingSpinner />;
      case 'form': return <QuoteInputForm onSubmit={handleQuoteSubmit} onScanImage={() => {}} isLoading={isLoading} currency={currency} setCurrency={setCurrency} />;
      case 'result': return currentQuote ? <QuoteResult quote={currentQuote} userSettings={userSettings} images={quoteImages} onReset={() => setPage('home')} onSaveOrUpdate={() => setPage('home')} onAutoSave={saveQuoteToDb} isViewingSaved={false} /> : null;
      case 'report-form': return <ReportInputForm onSubmit={handleReportSubmit} onScanImage={() => {}} isLoading={isLoading} />;
      case 'report-view': return currentReport ? <TechnicalReport data={currentReport} onUpdate={setCurrentReport} userSettings={userSettings} images={reportImages} isPrinting={false} onAddImage={()=>{}} onRemoveImage={()=>{}} onAutoDescribe={analyzeImageForReport} /> : null;
      case 'warranty-form': return <WarrantyInputForm onSubmit={handleWarrantySubmit} isLoading={isLoading} />;
      case 'warranty-view': return currentWarranty ? <WarrantyResult data={currentWarranty} userSettings={userSettings} onReset={() => setPage('home')} onAutoSave={saveWarrantyToDb} /> : null;
      case 'receipt-form': return <ReceiptInputForm onSubmit={handleReceiptSubmit} isLoading={isLoading} currency={currency} setCurrency={setCurrency} />;
      case 'receipt-view': return currentReceipt ? <ReceiptResult data={currentReceipt} userSettings={userSettings} onReset={() => setPage('home')} onAutoSave={saveReceiptToDb} /> : null;
      case 'discount-form': return <DiscountVoucherForm onSubmit={handleGenerateVoucherAction} isLoading={isLoading} currency={currency} />;
      case 'discount-view': return currentVoucher ? <DiscountVoucherResult data={currentVoucher} userSettings={userSettings} onReset={() => setPage('home')} /> : null;
      case 'consultant': return <ConsultantPage userSettings={userSettings} />;
      case 'history': return (
        <HistoryPage 
            onEditQuote={(q) => { setCurrentQuote(q); setPage('result'); }}
            onEditReport={(r) => { setCurrentReport(r); setPage('report-view'); }}
            onEditWarranty={(w) => { setCurrentWarranty(w); setPage('warranty-view'); }}
            onEditReceipt={(rec) => { setCurrentReceipt(rec); setPage('receipt-view'); }}
            onEditVoucher={(v) => { setCurrentVoucher(v); setPage('discount-view'); }}
        />
      );
      default: return <LandingPage onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex flex-col items-center font-sans pb-20">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={() => setPage('home')}>
                <img src={HIDROCLEAN_LOGO_URL} className="h-10 w-auto" alt="Logo" />
                <span className="ml-2 font-black text-primary tracking-tighter text-xl">IAO</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
                <NavItem target="home" icon={<GlobeIcon className="h-5 w-5" />} label="Home" />
                <NavItem target="form" icon={<PencilIcon className="h-5 w-5" />} label="Orçamento" />
                <NavItem target="report-form" icon={<ClipboardDocumentIcon className="h-5 w-5" />} label="Laudo" />
                <NavItem target="warranty-form" icon={<ShieldCheckIcon className="h-5 w-5" />} label="Garantia" />
                <NavItem target="consultant" icon={<ChatBubbleLeftRightIcon className="h-5 w-5" />} label="Consultor" />
                <NavItem target="history" icon={<HistoryIcon className="h-5 w-5" />} label="Histórico" />
            </div>
            <button onClick={() => { localStorage.removeItem('_iao_session_active'); window.location.reload(); }} className="p-2 text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase">Sair</button>
        </div>
      </nav>

      <main className="w-full max-w-6xl mt-20 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-[2rem] shadow-2xl p-6 sm:p-10 min-h-[70vh] relative border border-gray-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">{renderContent()}</div>
        </div>
      </main>
      <footer className="mt-8 text-center pb-24 md:pb-8 text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em]">HidroClean IA • Professional Tools v2.6</footer>
    </div>
  );
};

export default App;
