
import React, { useState, useEffect } from 'react';
import type { QuoteData, TechnicalReportData, WarrantyData, ReceiptData, DiscountVoucherData, PromoVoucherData, Currency } from '../types';
import { 
  fetchQuotes, deleteQuoteFromDb, 
  fetchReports, deleteReportFromDb,
  fetchWarranties, deleteWarrantyFromDb,
  fetchReceipts, deleteReceiptFromDb,
  fetchVouchers, deleteVoucherFromDb,
  fetchPromoVouchers, deletePromoVoucherFromDb
} from '../services/supabaseService';
import { TrashIcon, PencilIcon, ClipboardDocumentIcon, ShieldCheckIcon, SparklesIcon } from './AppIcons';

interface HistoryPageProps {
  onEditQuote: (quote: QuoteData) => void;
  onEditReport: (report: TechnicalReportData) => void;
  onEditWarranty: (warranty: WarrantyData) => void;
  onEditReceipt: (receipt: ReceiptData) => void;
  onEditVoucher: (voucher: DiscountVoucherData) => void;
  onEditPromo: (promo: PromoVoucherData) => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    const locales: Record<Currency, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'pt-PT' };
    return (value || 0).toLocaleString(locales[currency], { style: 'currency', currency });
};

export const HistoryPage: React.FC<HistoryPageProps> = ({ onEditQuote, onEditReport, onEditWarranty, onEditReceipt, onEditVoucher, onEditPromo }) => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'reports' | 'warranties' | 'receipts' | 'vouchers' | 'promos'>('quotes');
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [reports, setReports] = useState<TechnicalReportData[]>([]);
  const [warranties, setWarranties] = useState<WarrantyData[]>([]);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [vouchers, setVouchers] = useState<DiscountVoucherData[]>([]);
  const [promos, setPromos] = useState<PromoVoucherData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    const [q, r, w, rec, v, p] = await Promise.all([
      fetchQuotes(),
      fetchReports(),
      fetchWarranties(),
      fetchReceipts(),
      fetchVouchers(),
      fetchPromoVouchers()
    ]);
    setQuotes(q);
    setReports(r);
    setWarranties(w);
    setReceipts(rec);
    setVouchers(v);
    setPromos(p);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleDelete = async (id: string, type: string) => {
    if (!confirm("Tem certeza que deseja apagar este documento permanentemente?")) return;
    
    if (type === 'quote') await deleteQuoteFromDb(id);
    else if (type === 'report') await deleteReportFromDb(id);
    else if (type === 'warranty') await deleteWarrantyFromDb(id);
    else if (type === 'receipt') await deleteReceiptFromDb(id);
    else if (type === 'voucher') await deleteVoucherFromDb(id);
    else if (type === 'promo') await deletePromoVoucherFromDb(id);
    
    loadAllData();
  };

  const TabButton: React.FC<{ id: typeof activeTab; label: string }> = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all uppercase tracking-tighter ${
        activeTab === id 
        ? 'bg-primary text-white shadow-md' 
        : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  if (loading) return <div className="text-center py-20 font-bold text-gray-400 animate-pulse">CARREGANDO HISTÓRICO...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Arquivo de Documentos</h2>
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 overflow-x-auto max-w-full">
          <TabButton id="quotes" label="Orçamentos" />
          <TabButton id="promos" label="VIPs" />
          <TabButton id="vouchers" label="Vales" />
          <TabButton id="receipts" label="Recibos" />
          <TabButton id="reports" label="Laudos" />
          <TabButton id="warranties" label="Garantias" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeTab === 'quotes' && (
          quotes.length === 0 ? <EmptyState /> : quotes.map(q => (
            <ItemCard 
              key={q.id}
              title={q.clientName}
              subtitle={q.title}
              date={new Date(q.date).toLocaleDateString()}
              code={q.code || 'S/ REF'}
              info={formatCurrency(q.customTotal || 0, q.currency)}
              onEdit={() => onEditQuote(q)}
              onDelete={() => handleDelete(q.id, 'quote')}
            />
          ))
        )}

        {activeTab === 'promos' && (
          promos.length === 0 ? <EmptyState /> : promos.map(p => (
            <ItemCard 
              key={p.id}
              title={p.clientName || 'Nosso Cliente VIP'}
              subtitle={p.offerTitle}
              date={p.date}
              code={p.code}
              info={`Válido até ${p.expiryDate}`}
              onEdit={() => onEditPromo(p)}
              onDelete={() => handleDelete(p.id, 'promo')}
            />
          ))
        )}

        {activeTab === 'reports' && (
          reports.length === 0 ? <EmptyState /> : reports.map(r => (
            <ItemCard 
              key={r.id}
              title={r.clientInfo.name}
              subtitle={r.title}
              date={r.clientInfo.date}
              code={r.code || 'S/ REF'}
              info={r.clientInfo.buildingType}
              onEdit={() => onEditReport(r)}
              onDelete={() => r.id && handleDelete(r.id, 'report')}
            />
          ))
        )}

        {activeTab === 'warranties' && (
          warranties.length === 0 ? <EmptyState /> : warranties.map(w => (
            <ItemCard 
              key={w.id}
              title={w.clientName}
              subtitle={w.serviceDescription}
              date={w.startDate}
              code={w.code || 'S/ REF'}
              info={w.warrantyPeriod}
              onEdit={() => onEditWarranty(w)}
              onDelete={() => w.id && handleDelete(w.id, 'warranty')}
            />
          ))
        )}

        {activeTab === 'receipts' && (
          receipts.length === 0 ? <EmptyState /> : receipts.map(rec => (
            <ItemCard 
              key={rec.id}
              title={rec.clientName}
              subtitle={rec.description}
              date={rec.date}
              code={rec.code}
              info={formatCurrency(rec.amount, rec.currency)}
              onEdit={() => onEditReceipt(rec)}
              onDelete={() => handleDelete(rec.id, 'receipt')}
            />
          ))
        )}

        {activeTab === 'vouchers' && (
          vouchers.length === 0 ? <EmptyState /> : vouchers.map(v => (
            <ItemCard 
              key={v.id}
              title={v.clientName}
              subtitle={v.reason}
              date={v.date}
              code={v.code}
              info={`-${formatCurrency(v.discountValue, v.currency)}`}
              onEdit={() => onEditVoucher(v)}
              onDelete={() => handleDelete(v.id, 'voucher')}
            />
          ))
        )}
      </div>
    </div>
  );
};

const ItemCard: React.FC<{ 
    title: string; subtitle: string; date: string; code: string; info: string; 
    onEdit: () => void; onDelete: () => void;
}> = ({ title, subtitle, date, code, info, onEdit, onDelete }) => (
    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition flex justify-between items-center group">
        <div className="flex-grow cursor-pointer" onClick={onEdit}>
            <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-50 text-primary text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{code}</span>
                <span className="text-xs text-gray-400 font-bold">{date}</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
            <p className="text-sm text-gray-500 line-clamp-1 italic">{subtitle}</p>
            <p className="text-xs font-black text-primary mt-2 uppercase">{info}</p>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-3 bg-gray-50 text-gray-600 hover:bg-primary hover:text-white rounded-xl transition shadow-sm">
                <PencilIcon className="h-5 w-5" />
            </button>
            <button onClick={onDelete} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition shadow-sm">
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
        <div className="text-gray-300 mb-2">📂</div>
        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhum documento encontrado nesta categoria</p>
    </div>
);
