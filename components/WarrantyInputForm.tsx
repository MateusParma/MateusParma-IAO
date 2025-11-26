
import React, { useState } from 'react';
import { ShieldCheckIcon, UploadIcon } from './AppIcons';

interface WarrantyInputFormProps {
  onSubmit: (clientName: string, clientNif: string, clientAddress: string, serviceDescription: string) => void;
  isLoading: boolean;
}

export const WarrantyInputForm: React.FC<WarrantyInputFormProps> = ({ onSubmit, isLoading }) => {
  const [clientName, setClientName] = useState('');
  const [clientNif, setClientNif] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName && serviceDescription) {
      onSubmit(clientName, clientNif, clientAddress, serviceDescription);
    } else {
      alert('Preencha o nome do cliente e a descrição do serviço.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <ShieldCheckIcon className="h-10 w-10 text-primary" />
            Novo Termo de Garantia
        </h2>
        <p className="text-gray-500 mt-2">Gere um documento formal de garantia com prazos automáticos (12 meses geral / 30 dias desentupimento).</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Cliente</label>
                    <input 
                        type="text" 
                        value={clientName} 
                        onChange={e => setClientName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="Nome completo ou Empresa"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">NIF (Opcional)</label>
                    <input 
                        type="text" 
                        value={clientNif} 
                        onChange={e => setClientNif(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="Número de Contribuinte"
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Endereço do Serviço</label>
                <input 
                    type="text" 
                    value={clientAddress} 
                    onChange={e => setClientAddress(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    placeholder="Local onde o serviço foi executado"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descrição do Serviço Executado</label>
                <textarea 
                    value={serviceDescription}
                    onChange={e => setServiceDescription(e.target.value)}
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    placeholder="Ex: Desentupimento de sanita... ou Instalação de tubulação nova..."
                    required
                />
                <p className="text-xs text-gray-500 mt-2">A IA detectará automaticamente se é "Desentupimento" (30 dias) ou outro serviço (12 meses).</p>
            </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-secondary transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
            {isLoading ? 'Gerando Documento...' : (
                <>
                    <UploadIcon className="h-5 w-5 mr-2" />
                    Gerar Termo de Garantia
                </>
            )}
        </button>
      </div>
    </form>
  );
};
