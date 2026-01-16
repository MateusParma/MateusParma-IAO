
import React, { useState } from 'react';
import { SparklesIcon, UploadIcon } from './AppIcons';
import type { PromoVoucherData } from '../types';

interface PromoVoucherFormProps {
  onSubmit: (data: Omit<PromoVoucherData, 'id' | 'code' | 'date'>) => void;
  isLoading: boolean;
}

export const PromoVoucherForm: React.FC<PromoVoucherFormProps> = ({ onSubmit, isLoading }) => {
  const [clientName, setClientName] = useState('');
  const [offerTitle, setOfferTitle] = useState('Bónus de Primeiro Serviço');
  const [discountDescription, setDiscountDescription] = useState('10% de desconto imediato na sua próxima fatura de canalização.');
  const [conditions, setConditions] = useState('Válido apenas para novos clientes em serviços acima de 50€. Não acumulável com outras promoções.');
  const [expiryDays, setExpiryDays] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName && offerTitle && discountDescription) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expiryDays);
      
      onSubmit({
        clientName,
        offerTitle,
        discountDescription,
        conditions,
        expiryDate: expiry.toLocaleDateString('pt-PT')
      });
    } else {
      alert('Por favor, preencha o nome do cliente e o título da oferta.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <SparklesIcon className="h-10 w-10 text-yellow-500" />
            Voucher de Promoção
        </h2>
        <p className="text-gray-500 mt-2 uppercase text-[10px] font-bold tracking-widest">Marketing e Fidelização de Clientes</p>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Cliente (Opcional ou "Estimado Cliente")</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={e => setClientName(e.target.value)} 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 outline-none font-bold" 
                  placeholder="Ex: Maria Silva ou Estimado Cliente" 
                />
            </div>
            
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Título da Oferta</label>
                <input 
                  type="text" 
                  value={offerTitle} 
                  onChange={e => setOfferTitle(e.target.value)} 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 outline-none" 
                  placeholder="Ex: Bónus de Boas-vindas" 
                />
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Validade (Dias)</label>
                <input 
                  type="number" 
                  value={expiryDays} 
                  onChange={e => setExpiryDays(Number(e.target.value))} 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 outline-none" 
                />
            </div>
        </div>

        <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrição do Benefício</label>
            <textarea 
              value={discountDescription} 
              onChange={e => setDiscountDescription(e.target.value)} 
              rows={2} 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 outline-none" 
              placeholder="Ex: 10€ de desconto na sua próxima intervenção." 
            />
        </div>

        <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Condições de Utilização</label>
            <textarea 
              value={conditions} 
              onChange={e => setConditions(e.target.value)} 
              rows={2} 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 outline-none text-xs" 
            />
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-12 py-5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl transition transform active:scale-95 disabled:opacity-50 flex items-center gap-3"
        >
            {isLoading ? 'A Processar...' : <><UploadIcon className="h-6 w-6" /> Criar Voucher VIP</>}
        </button>
      </div>
    </form>
  );
};
