
import React, { useState } from 'react';
import type { QuoteData, Currency, TechnicalReportData } from '../types';
import { PencilIcon, TrashIcon, EyeIcon, ClipboardDocumentIcon, CheckCircleIcon, XCircleIcon } from './AppIcons';

interface QuoteHistoryProps {
  quotes: QuoteData[];
  reports: TechnicalReportData[];
  onNewQuote: () => void;
  onNewReport: () => void;
  onViewQuote: (id: string) => void;
  onViewReport: (id: string) => void;
  onDeleteQuote: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onUpdateQuoteStatus?: (id: string, status: 'pending' | 'accepted' | 'rejected') => void;
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
    onDeleteReport,
    onUpdateQuoteStatus
}) => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'reports'>('quotes');
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  // Função auxiliar para renderizar lista vazia
  const EmptyState = ({ type }: { type: 'quotes' | 'reports' }) => (
      <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700">
            {type === 'quotes' ? 'Nenhum orçamento encontrado' : 'Nenhum relatório salvo'}
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

  const filteredQuotes = quotes.filter(q => {
      if (quoteFilter === 'all') return true;
      const status = q.status || 'pending';
      return status === quoteFilter;
  }).slice().reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Histórico</h2>
        
        {/* Abas Principais */}
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

      {/* Filtros de Status (Apenas para Orçamentos) */}
      {activeTab === 'quotes' && quotes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
              <button 
                onClick={() => setQuoteFilter('all')} 
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${quoteFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                  Todos
              </button>
              <button 
                onClick={() => setQuoteFilter('pending')} 
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${quoteFilter === 'pending' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-400'}`}
              >
                  Pendentes
              </button>
              <button 
                onClick={() => setQuoteFilter('accepted')} 
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${quoteFilter === 'accepted' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
              >
                  Aprovados
              </button>
              <button 
                onClick={() => setQuoteFilter('rejected')} 
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${quoteFilter === 'rejected' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-400'}`}
              >
                  Recusados
              </button>
          </div>
      )}

      {activeTab === 'quotes' && (
          <>
            {filteredQuotes.length === 0 ? (
                <EmptyState type="quotes" />
            ) : (
                <ul className="space-y-4">
                    {filteredQuotes.map((quote) => {
                        const totalPrice = quote.steps.reduce((acc, step) => {
                            const price = Number(step.userPrice) || 0;
                            const tax = Number(step.taxRate) || 0;
                            const quantity = Number(step.quantity) || 1;
                            return acc + (price * quantity) * (1 + tax / 100);
                        }, 0);
                        
                        const status = quote.status || 'pending';

                        return (
                            <li key={quote.id} className={`p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center group hover:shadow-md transition-shadow ${status === 'rejected' ? 'opacity-75' : ''}`}>
                                <div className="flex-grow cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">{quote.code || 'N/A'}</span>
                                        {status === 'accepted' && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded flex items-center"><CheckCircleIcon className="h-3 w-3 mr-1"/>Aprovado</span>}
                                        {status === 'rejected' && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded flex items-center"><XCircleIcon className="h-3 w-3 mr-1"/>Recusado</span>}
                                        {status === 'pending' && <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded">Pendente</span>}
                                        
                                        <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors w-full sm:w-auto mt-1 sm:mt-0">{quote.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{quote.clientName}</span></p>
                                    <p className="text-xs text-gray-500">{new Date(quote.date).toLocaleDateString('pt-BR')} - Total: {formatCurrency(totalPrice, quote.currency)}</p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 mt-3 sm:mt-0">
                                    {/* Status Actions */}
                                    {onUpdateQuoteStatus && (
                                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-gray-100">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onUpdateQuoteStatus(quote.id, 'accepted'); }}
                                                className={`p-1.5 rounded-full transition ${status === 'accepted' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                title="Aprovar Orçamento"
                                            >
                                                <CheckCircleIcon className="h-5 w-5" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onUpdateQuoteStatus(quote.id, 'rejected'); }}
                                                className={`p-1.5 rounded-full transition ${status === 'rejected' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                                title="Recusar Orçamento"
                                            >
                                                <XCircleIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
                                        <button onClick={() => onViewQuote(quote.id)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-100 rounded-full transition" aria-label="Ver">
                                            <EyeIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteQuote(quote.id) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition" aria-label="Deletar">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
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