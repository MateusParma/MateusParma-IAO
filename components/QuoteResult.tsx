
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { QuoteData, QuoteStep, Currency, UserSettings, TechnicalReportData, PaymentMethodType, PaymentInstallment } from '../types';
import { CheckCircleIcon, PencilIcon, DownloadIcon, TrashIcon, PlusIcon, SparklesIcon, ShieldCheckIcon } from './AppIcons';
import { generateDirectTechnicalReport, analyzeImageForReport, generateSingleQuoteStep } from '../services/geminiService';
import { TechnicalReport } from './TechnicalReport';

declare const jspdf: any;
declare const html2canvas: any;

interface QuoteResultProps {
  quote: QuoteData;
  userSettings: UserSettings;
  images: File[];
  onReset: () => void;
  onSaveOrUpdate: (finalQuote: QuoteData) => void;
  onAutoSave: (updatedQuote: QuoteData) => void;
  isViewingSaved: boolean;
}

const formatCurrency = (value: number, currency: Currency) => {
    const locales: Record<Currency, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'pt-PT' };
    return (value || 0).toLocaleString(locales[currency], { style: 'currency', currency });
};

export const QuoteResult: React.FC<QuoteResultProps> = ({ quote, userSettings, images, onReset, onSaveOrUpdate, onAutoSave, isViewingSaved }) => {
  const [editedQuote, setEditedQuote] = useState<QuoteData>(() => {
      const initialQuote = JSON.parse(JSON.stringify(quote));
      initialQuote.steps = initialQuote.steps.map((step: any) => ({
          ...step,
          id: step.id || `step-${Date.now()}-${Math.random()}`
      }));
      return initialQuote;
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [viewMode, setViewMode] = useState<'quote' | 'report'>('quote');
  const [reportData, setReportData] = useState<TechnicalReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const pdfRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
          onAutoSave(editedQuote);
          setSaveStatus('saved');
      }, 1000);
      return () => clearTimeout(timer);
  }, [editedQuote, onAutoSave]);

  const handleDownloadPdf = async () => {
    setIsPrinting(true);
    setTimeout(async () => {
      const targetRef = viewMode === 'report' ? reportRef : pdfRef;
      if (!targetRef.current) { setIsPrinting(false); return; }
      
      const { jsPDF } = jspdf;
      const canvas = await html2canvas(targetRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${viewMode === 'report' ? 'Laudo' : 'Orcamento'}_${editedQuote.clientName.replace(/\s/g, '_')}.pdf`);
      setIsPrinting(false);
    }, 500);
  };

  const { subtotal, totalTax, grandTotal } = useMemo(() => {
    const sub = editedQuote.steps.reduce((acc, step) => acc + (Number(step.userPrice || 0) * Number(step.quantity || 0)), 0);
    const tax = editedQuote.steps.reduce((acc, step) => acc + ((Number(step.userPrice || 0) * Number(step.quantity || 0)) * (Number(step.taxRate || 0) / 100)), 0);
    return { subtotal: sub, totalTax: tax, grandTotal: sub + tax };
  }, [editedQuote.steps]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md p-3 rounded-xl mb-6 flex justify-between items-center border shadow-md gap-3">
           <div className="flex gap-2">
                <button onClick={() => setViewMode('quote')} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'quote' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}>Orçamento</button>
                <button onClick={() => reportData ? setViewMode('report') : handleDownloadPdf()} className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode === 'report' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:bg-gray-100'}`}>Laudo</button>
           </div>
           <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] font-bold text-gray-400 uppercase">{saveStatus === 'saving' ? 'Gravando...' : 'Guardado'}</span>
              <button onClick={handleDownloadPdf} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
                <DownloadIcon className="h-5 w-5" /> <span className="hidden sm:inline">Baixar PDF</span>
              </button>
              <button onClick={() => onSaveOrUpdate(editedQuote)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Sair</button>
           </div>
       </div>

       <div className="flex justify-center overflow-x-auto p-1">
          <div ref={pdfRef} className={`bg-white w-full max-w-4xl ${isPrinting ? 'p-0' : 'p-8 sm:p-12 shadow-xl border'}`} style={{ minHeight: '297mm' }}>
              {/* Cabeçalho e conteúdo do orçamento (Simplificado para o XML) */}
              <div className="border-b-4 border-primary pb-6 mb-8 flex justify-between">
                  <div className="flex items-center gap-4">
                      <img src={userSettings.companyLogo} className="h-16 w-auto" alt="Logo" />
                      <div>
                          <h1 className="font-black text-xl text-gray-900 uppercase">{userSettings.companyName}</h1>
                          <p className="text-xs text-gray-500">{userSettings.companyAddress}</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <h2 className="text-3xl font-black text-primary">ORÇAMENTO</h2>
                      <p className="font-mono text-sm font-bold">REF: {editedQuote.code || 'S/N'}</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-50 p-6 rounded-xl border">
                  <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">Cliente</h3>
                      <p className="font-bold text-lg">{editedQuote.clientName}</p>
                      <p className="text-sm text-gray-600">{editedQuote.clientAddress}</p>
                  </div>
                  <div className="text-right">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">Resumo</h3>
                      <p className="italic text-sm text-gray-700">"{editedQuote.summary}"</p>
                  </div>
              </div>

              <table className="w-full text-left mb-10">
                  <thead className="bg-primary text-white uppercase text-[10px] font-black">
                      <tr>
                          <th className="p-3">Descrição</th>
                          <th className="p-3 text-center">Qtd</th>
                          <th className="p-3 text-right">Total</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y">
                      {editedQuote.steps.map((step, i) => (
                          <tr key={i} className="text-sm">
                              <td className="p-4">
                                  <p className="font-bold text-gray-900">{step.title}</p>
                                  <p className="text-gray-500 text-xs">{step.description}</p>
                              </td>
                              <td className="p-4 text-center">{step.quantity}</td>
                              <td className="p-4 text-right font-bold">{formatCurrency((step.userPrice * step.quantity) * (1 + step.taxRate/100), editedQuote.currency)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>

              <div className="flex flex-col items-end pt-6 border-t-2 border-gray-100">
                  <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm text-gray-500"><span>Subtotal:</span><span>{formatCurrency(subtotal, editedQuote.currency)}</span></div>
                      <div className="flex justify-between text-sm text-gray-500"><span>IVA:</span><span>{formatCurrency(totalTax, editedQuote.currency)}</span></div>
                      <div className="flex justify-between text-xl font-black text-primary pt-2 border-t"><span>TOTAL:</span><span>{formatCurrency(grandTotal, editedQuote.currency)}</span></div>
                  </div>
              </div>
          </div>
       </div>
    </div>
  );
};
