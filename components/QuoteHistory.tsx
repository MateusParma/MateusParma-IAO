
import React, { useState } from 'react';
import type { QuoteData, Currency, TechnicalReportData, WarrantyData, ReceiptData } from '../types';
import { PencilIcon, TrashIcon, EyeIcon, ClipboardDocumentIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon } from './AppIcons';

interface QuoteHistoryProps {
  quotes: QuoteData[];
  reports: TechnicalReportData[];
  warranties: WarrantyData[];
  receipts?: ReceiptData[];
  onNewQuote: () => void;
  onNewReport: () => void;
  onViewQuote: (id: string) => void;
  onViewReport: (id: string) => void;
  onViewWarranty: (id: string) => void;
  onViewReceipt: (id: string) => void;
  onDeleteQuote: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onDeleteWarranty: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    const locales: Record<Currency, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'pt-PT' };
    return value.toLocaleString(locales[currency], { style: 'currency', currency });
};

export const QuoteHistory: React.FC<QuoteHistoryProps> = ({ 
    quotes, reports, warranties, receipts = [],
    onNewQuote, onNewReport, onViewQuote, onViewReport, onViewWarranty, onViewReceipt,
    onDeleteQuote, onDeleteReport, onDeleteWarranty, onDeleteReceipt
}) => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'reports' | 'warranties' | 'receipts'>('quotes');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Histórico</h2>
        <div className="bg-gray-200 p-1 rounded-lg flex space-x-1 overflow-x-auto">
            {['quotes', 'reports', 'warranties', 'receipts'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === tab ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>
                    {tab === 'quotes' ? 'Orçamentos' : tab === 'reports' ? 'Laudos' : tab === 'warranties' ? 'Garantias' : 'Recibos'}
                </button>
            ))}
        </div>
      </div>

      {activeTab === 'receipts' && (
          <ul className="space-y-4">
            {receipts.length === 0 ? <p className="text-center text-gray-500 py-10">Nenhum recibo salvo.</p> : receipts.map((r) => (
                <li key={r.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex justify-between items-center group hover:shadow-md transition">
                    <div className="cursor-pointer" onClick={() => onViewReceipt(r.id)}>
                        <h3 className="font-bold text-lg text-primary">{r.code} - {r.clientName}</h3>
                        <p className="text-sm text-gray-500">{r.date} - {formatCurrency(r.amount, r.currency)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onViewReceipt(r.id)} className="p-2 text-gray-400 hover:text-primary transition"><EyeIcon className="h-5 w-5" /></button>
                        <button onClick={() => onDeleteReceipt(r.id)} className="p-2 text-gray-400 hover:text-red-600 transition"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                </li>
            ))}
          </ul>
      )}

      {/* Outras abas mantidas conforme original... */}
      {activeTab === 'quotes' && (
          <ul className="space-y-4">
            {quotes.map((q) => (
                <li key={q.id} className="p-4 bg-white rounded-lg border border-gray-200 flex justify-between items-center group">
                    <div className="cursor-pointer" onClick={() => onViewQuote(q.id)}>
                        <h3 className="font-bold">{q.code} - {q.clientName}</h3>
                        <p className="text-sm text-gray-500">{q.title}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onViewQuote(q.id)} className="p-2 hover:text-primary"><EyeIcon className="h-5 w-5" /></button>
                        <button onClick={() => onDeleteQuote(q.id)} className="p-2 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                </li>
            ))}
          </ul>
      )}
      {activeTab === 'reports' && (
          <ul className="space-y-4">
            {reports.map((r) => (
                <li key={r.id} className="p-4 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => r.id && onViewReport(r.id)}>
                        <h3 className="font-bold">{r.code} - {r.clientInfo.name}</h3>
                    </div>
                    <button onClick={() => r.id && onDeleteReport(r.id)} className="p-2 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                </li>
            ))}
          </ul>
      )}
      {activeTab === 'warranties' && (
          <ul className="space-y-4">
            {warranties.map((w) => (
                <li key={w.id} className="p-4 bg-white rounded-lg border border-gray-200 flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => w.id && onViewWarranty(w.id)}>
                        <h3 className="font-bold">{w.code} - {w.clientName}</h3>
                    </div>
                    <button onClick={() => w.id && onDeleteWarranty(w.id)} className="p-2 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                </li>
            ))}
          </ul>
      )}
    </div>
  );
};
