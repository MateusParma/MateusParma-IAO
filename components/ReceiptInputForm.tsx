
import React, { useState } from 'react';
import { ClipboardDocumentIcon, UploadIcon } from './AppIcons';
import type { Currency } from '../types';

interface ReceiptInputFormProps {
  onSubmit: (clientName: string, clientNif: string, amount: number, description: string, currency: Currency, paymentMethod: string) => void;
  isLoading: boolean;
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const ReceiptInputForm: React.FC<ReceiptInputFormProps> = ({ onSubmit, isLoading, currency, setCurrency }) => {
  const [clientName, setClientName] = useState('');
  const [clientNif, setClientNif] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferência Bancária');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName && amount > 0 && description) {
      onSubmit(clientName, clientNif, amount, description, currency, paymentMethod);
    } else {
      alert('Preencha os campos obrigatórios.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <ClipboardDocumentIcon className="h-10 w-10 text-primary" />
            Novo Recibo
        </h2>
        <p className="text-gray-500 mt-2">Gere um comprovante de pagamento profissional em segundos.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Cliente</label>
                    <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nome do Pagador" required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">NIF (Opcional)</label>
                    <input type="text" value={clientNif} onChange={e => setClientNif(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Número de Contribuinte" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Valor</label>
                    <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="0,00" required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Moeda</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="EUR">Euro (€)</option>
                        <option value="BRL">Real (R$)</option>
                        <option value="USD">Dólar ($)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Pagamento</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="Transferência Bancária">Transferência</option>
                        <option value="MBWay">MBWay</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão">Cartão</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Referente a</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Ex: Pagamento referente ao serviço de canalização da cozinha..." required />
            </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button type="submit" disabled={isLoading} className="px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-secondary transition flex items-center">
            {isLoading ? 'Processando...' : <><UploadIcon className="h-5 w-5 mr-2" /> Gerar Recibo Inteligente</>}
        </button>
      </div>
    </form>
  );
};
