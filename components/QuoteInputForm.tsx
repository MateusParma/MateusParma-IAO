
import React, { useState, useRef } from 'react';
import { CameraIcon, UploadIcon, GlobeIcon, PencilIcon, CheckCircleIcon, SparklesIcon } from './AppIcons';
import type { Currency } from '../types';

interface QuoteInputFormProps {
  onSubmit: (description: string, city: string, images: File[], currency: Currency, clientName: string, clientAddress: string, clientContact: string, includeDescriptions: boolean) => void;
  onScanImage: (file: File, currentData: any) => void;
  isLoading: boolean;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const QuoteInputForm: React.FC<QuoteInputFormProps> = ({ onSubmit, onScanImage, isLoading, currency, setCurrency }) => {
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [includeDescriptions, setIncludeDescriptions] = useState(true); // Novo estado
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray: File[] = Array.from(event.target.files);
      setImages(prevImages => [...prevImages, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const handleScanClick = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          // Pass current state so we don't lose it when switching pages
          onScanImage(file, { description, city, images, currency, clientName, clientAddress, clientContact, includeDescriptions });
      }
  }
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
        const newPreviews = prev.filter((_, i) => i !== index);
        URL.revokeObjectURL(prev[index]);
        return newPreviews;
    });
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (description && city && clientName) {
      onSubmit(description, city, images, currency, clientName, clientAddress, clientContact, includeDescriptions);
    } else {
      alert('Por favor, preencha os dados do cliente, a cidade e a descrição do serviço.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-5xl mx-auto">
       
       {/* Header Section */}
       <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Novo Orçamento</h2>
          <p className="text-gray-500 mt-2">Preencha os dados abaixo para que a IA gere uma proposta comercial completa.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Left Column: Client & Location */}
         <div className="lg:col-span-1 space-y-6">
            {/* Client Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4 border-b pb-2 border-gray-100">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Dados do Cliente</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="clientName" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nome Completo</label>
                        <input id="clientName" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none font-medium text-gray-800 placeholder-gray-400" placeholder="Ex: João da Silva" required />
                    </div>
                    <div>
                        <label htmlFor="clientContact" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Contato</label>
                        <input id="clientContact" type="text" value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none text-gray-800 placeholder-gray-400" placeholder="Tel ou Email" />
                    </div>
                    <div>
                        <label htmlFor="clientAddress" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Endereço da Obra</label>
                        <textarea id="clientAddress" rows={2} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none text-gray-800 placeholder-gray-400" placeholder="Rua, Número, Andar..." />
                    </div>
                </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-4 border-b pb-2 border-gray-100">
                     <div className="bg-green-100 p-2 rounded-lg mr-3">
                         <GlobeIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Configuração</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="city" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Cidade (Base de Preço)
                        </label>
                        <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none font-medium text-gray-800"
                        placeholder="Ex: Lisboa"
                        required
                        />
                    </div>
                    <div>
                        <label htmlFor="currency" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                            Moeda
                        </label>
                        <div className="relative">
                            <select
                                id="currency"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as Currency)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none appearance-none font-medium text-gray-800 cursor-pointer"
                            >
                                <option value="EUR">Euro (€)</option>
                                <option value="BRL">Real (R$)</option>
                                <option value="USD">Dólar ($)</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         </div>

         {/* Right Column: Job Details & Photos */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                 <div className="flex items-center justify-between mb-4 border-b pb-2 border-gray-100">
                    <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                             <PencilIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Detalhes do Serviço</h3>
                    </div>
                    
                    {/* Scan Button */}
                    <div>
                        <input 
                            ref={scanInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleScanClick}
                        />
                        <button 
                            type="button"
                            onClick={() => scanInputRef.current?.click()}
                            className="flex items-center text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-2 rounded-lg hover:shadow-md transition transform hover:-translate-y-0.5"
                        >
                            <SparklesIcon className="h-4 w-4 mr-1.5" />
                            Digitalizar Rascunho/Foto
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow space-y-6">
                    <div>
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                        O que precisa ser feito?
                        </label>
                        <textarea
                        id="description"
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-4 text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none resize-none"
                        placeholder="Ex: Preciso pintar a sala de 20m² com tinta acrílica branca. As paredes precisam de lixamento e massa corrida em alguns pontos. Incluir proteção do piso."
                        required
                        />
                        <div className="mt-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start text-xs text-gray-500 bg-blue-50 p-3 rounded-lg text-blue-800 flex-grow">
                                <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Dica: Seja específico com quantidades (m², unidades) e ações (instalar, remover, reparar).
                            </div>

                            {/* Include Descriptions Toggle */}
                            <label className="flex items-center cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition select-none flex-shrink-0">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={includeDescriptions}
                                        onChange={(e) => setIncludeDescriptions(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${includeDescriptions ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${includeDescriptions ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-sm font-bold text-gray-700">
                                    Detalhar Etapas
                                </span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Fotos do Local (Opcional)</label>
                        <div 
                        className="group relative flex justify-center px-6 pt-10 pb-10 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 hover:border-primary transition cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="space-y-2 text-center">
                                <div className="mx-auto h-14 w-14 bg-gray-100 group-hover:bg-white rounded-full flex items-center justify-center transition">
                                     <CameraIcon className="h-8 w-8 text-gray-400 group-hover:text-primary" />
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="font-semibold text-primary">Clique para enviar</span> ou arraste imagens
                                </div>
                                <p className="text-xs text-gray-400">Suporta JPG, PNG (Max 10MB)</p>
                            </div>
                        </div>
                        <input
                        ref={fileInputRef}
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                        />

                        {imagePreviews.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Imagens Selecionadas ({imagePreviews.length})</h4>
                                <div className="flex flex-wrap gap-3">
                                    {imagePreviews.map((src, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden shadow-sm border border-gray-200 group">
                                        <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        <button 
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold"
                                        >
                                        ✕
                                        </button>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
         </div>
       </div>

      <div className="pt-4">
        <button
            type="submit"
            disabled={isLoading || !description || !city || !clientName}
            className="w-full md:w-auto md:min-w-[300px] mx-auto flex justify-center items-center py-4 px-8 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-gradient-to-r from-primary to-secondary hover:to-primary hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
        >
            {isLoading ? (
                <span className="flex items-center">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Processando...
                </span>
            ) : (
                <>
                    <UploadIcon className="h-6 w-6 mr-2" />
                    Gerar Orçamento Profissional
                </>
            )}
        </button>
      </div>
    </form>
  );
};
