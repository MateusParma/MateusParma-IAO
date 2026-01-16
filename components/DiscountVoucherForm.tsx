
import React, { useState, useMemo } from 'react';
import { SparklesIcon, UploadIcon } from './AppIcons';
import type { Currency, DiscountVoucherData } from '../types';

interface DiscountVoucherFormProps {
  onSubmit: (data: Omit<DiscountVoucherData, 'id' | 'code' | 'date' | 'expiryDate'>) => void;
  isLoading: boolean;
  currency: Currency;
}

export const DiscountVoucherForm: React.FC<DiscountVoucherFormProps> = ({ onSubmit, isLoading, currency }) => {
  const [clientName, setClientName] = useState('');
  const [baseValue, setBaseValue] = useState<number>(0);
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [taxRate, setTaxRate] = useState<number>(23);
  const [reason, setReason] = useState('');

  const calculations = useMemo(() => {
    let discAmount = 0;
    if (type === 'percentage') {
      discAmount = baseValue * (discountInput / 100);
    } else {
      discAmount = discountInput;
    }
    
    const valueAfterDiscount = Math.max(0, baseValue - discAmount);
    const taxAmount = valueAfterDiscount * (taxRate / 100);
    const finalValue = valueAfterDiscount + taxAmount;

    return { discAmount, valueAfterDiscount, taxAmount, finalValue };
  }, [baseValue, discountInput, type, taxRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName && baseValue > 0 && reason) {
      onSubmit({
        clientName,
        baseValue,
        discountValue: discountInput,
        type,
        taxRate,
        currency,
        reason,
        finalValue: calculations.finalValue,
        taxAmount: calculations.taxAmount
      });
    } else {
      alert('Preencha os campos obrigatórios.');
    }
  };

  const format = (val: number) => val.toLocaleString('pt-PT', { style: 'currency', currency });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <SparklesIcon className="h-10 w-10 text-orange-500" />
            Gerador de Desconto Comercial
        </h2>
        <p className="text-gray-500 mt-2">Crie uma proposta de desconto formal com cálculo de impostos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 uppercase text-xs tracking-widest">Dados do Beneficiário</h3>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome do Cliente</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Maria Silva" required />
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Motivo do Desconto</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Fidelidade / Ajuste Comercial" required />
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 uppercase text-xs tracking-widest">Valores e Taxas</h3>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Valor Base do Serviço (S/ IVA)</label>
                <input type="number" value={baseValue || ''} onChange={e => setBaseValue(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-lg" placeholder="0.00" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Desconto Aplicado</label>
                    <div className="flex">
                        <input type="number" value={discountInput || ''} onChange={e => setDiscountInput(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="0" />
                        <button type="button" onClick={() => setType(type === 'percentage' ? 'fixed' : 'percentage')} className="bg-orange-500 text-white px-3 rounded-r-xl font-bold text-xs uppercase transition hover:bg-orange-600">
                            {type === 'percentage' ? '%' : currency}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Taxa de IVA</label>
                    <select value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold">
                        <option value="0">0% (Isento)</option>
                        <option value="6">6% (Reduzido)</option>
                        <option value="11">11% (Intermédio)</option>
                        <option value="23">23% (Normal)</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex flex-wrap justify-between items-center gap-4">
          <div className="space-y-1">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Resumo do Benefício</p>
              <div className="flex gap-6">
                  <div><span className="text-xs text-gray-500">Subtotal:</span> <span className="font-bold text-gray-700">{format(baseValue)}</span></div>
                  <div><span className="text-xs text-gray-500">Desconto:</span> <span className="font-bold text-red-500">-{format(calculations.discAmount)}</span></div>
                  <div><span className="text-xs text-gray-500">IVA ({taxRate}%):</span> <span className="font-bold text-gray-700">{format(calculations.taxAmount)}</span></div>
              </div>
          </div>
          <div className="text-right">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Total com Desconto</p>
              <p className="text-3xl font-black text-orange-600">{format(calculations.finalValue)}</p>
          </div>
      </div>

      <div className="flex justify-center">
        <button type="submit" disabled={isLoading} className="px-10 py-4 bg-orange-500 text-white font-black uppercase tracking-widest rounded-full shadow-xl hover:bg-orange-600 transition flex items-center transform active:scale-95 disabled:opacity-50">
            {isLoading ? '...' : <><UploadIcon className="h-5 w-5 mr-2" /> Gerar Vale de Desconto</>}
        </button>
      </div>
    </form>
  );
};
