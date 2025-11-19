
import React, { useState } from 'react';
import type { QuoteData, Currency, TechnicalReportData } from '../types';
import { PencilIcon, TrashIcon, EyeIcon, ClipboardDocumentIcon } from './AppIcons';

interface QuoteHistoryProps {
  quotes: QuoteData[];
  reports: TechnicalReportData[];
  onNewQuote: () => void;
  onNewReport: () => void;
  onViewQuote: (id: string) => void;
  onViewReport: (id: string) => void;
  onDeleteQuote: (id: string) => void;
  onDeleteReport: (id: string) => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    const locales: Record<Currency, string> = {
        'BRL': 'pt-BR',
        'USD': 'en-US',
        'EUR': 'pt-PT'
    };
    return value.toLocaleString(locales[currency], { style: 'currency', currency });
};

export const QuoteHistory: React.FC<QuoteHistoryProps> = ({ 
    quotes, 
    reports, 
    onNewQuote, 
    onNewReport, 
    onViewQuote, 
    onViewReport, 
    onDeleteQuote, 
    onDeleteReport 
}) => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'reports'>('quotes');

  // Função auxiliar para renderizar lista vazia
  const EmptyState = ({ type }: { type: 'quotes' | 'reports' }) => (
      <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700">
            {type === 'quotes' ? 'Nenhum orçamento salvo' : 'Nenhum relatório salvo'}
        </h2>
        <p className="mt-2 text-gray-500">
            {type === 'quotes' ? 'Crie seu primeiro orçamento para vê-lo aqui.' : 'Crie seu primeiro laudo técnico para vê-lo aqui.'}
        </p>
        <button
          onClick={type === 'quotes' ? onNewQuote : onNewReport}
          className="mt-6 inline-flex items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
        >
          {type === 'quotes' ? <PencilIcon className="h-5 w-5 mr-2" /> : <ClipboardDocumentIcon className="h-5 w-5 mr-2" />}
          {type === 'quotes' ? 'Criar Novo Orçamento' : 'Criar Novo Laudo'}
        </button>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Histórico</h2>
        
        {/* Abas */}
        <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
            <button
                onClick={() => setActiveTab('quotes')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'quotes' ? 'bg-white text-primary shadow' : 'text-gray-600 hover:text-gray-800'}`}
            >
                Orçamentos
            </button>
            <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'reports' ? 'bg-white text-primary shadow' : 'text-gray-600 hover:text-gray-800'}`}
            >
                Laudos / Relatórios
            </button>
        </div>
      </div>

      {activeTab === 'quotes' && (
          <>
            {quotes.length === 0 ? (
                <EmptyState type="quotes" />
            ) : (
                <ul className="space-y-4">
                    {quotes.slice().reverse().map((quote) => {
                        const totalPrice = quote.steps.reduce((acc, step) => {
                            const price = Number(step.userPrice) || 0;
                            const tax = Number(step.taxRate) || 0;
                            const quantity = Number(step.quantity) || 1;
                            return acc + (price * quantity) * (1 + tax / 100);
                        }, 0);
                        return (
                            <li key={quote.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center group hover:shadow-md transition-shadow">
                                <div className="flex-grow cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">{quote.code || 'N/A'}</span>
                                        <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors">{quote.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{quote.clientName}</span></p>
                                    <p className="text-xs text-gray-500">{new Date(quote.date).toLocaleDateString('pt-BR')} - Total: {formatCurrency(totalPrice, quote.currency)}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-center">
                                    <button onClick={() => onViewQuote(quote.id)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-100 rounded-full transition" aria-label="Ver">
                                        <EyeIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteQuote(quote.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition" aria-label="Deletar">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
          </>
      )}

      {activeTab === 'reports' && (
          <>
            {reports.length === 0 ? (
                 <EmptyState type="reports" />
            ) : (
                 <ul className="space-y-4">
                    {reports.slice().reverse().map((report) => (
                        <li key={report.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center group hover:shadow-md transition-shadow">
                            <div className="flex-grow cursor-pointer" onClick={() => report.id && onViewReport(report.id)}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">{report.code || 'N/A'}</span>
                                    <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors">{report.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{report.clientInfo.name}</span></p>
                                <p className="text-xs text-gray-500">{report.clientInfo.date} - {report.clientInfo.address}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-center">
                                <button onClick={() => report.id && onViewReport(report.id)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-100 rounded-full transition" aria-label="Ver">
                                    <EyeIcon className="h-5 w-5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); report.id && onDeleteReport(report.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition" aria-label="Deletar">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
          </>
      )}
    </div>
  );
};
