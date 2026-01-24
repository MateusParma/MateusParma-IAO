
import React, { useState, useRef } from 'react';
import { CameraIcon, UploadIcon, ClipboardDocumentIcon, SparklesIcon } from './AppIcons';
import type { ReportType } from '../types';

interface ReportInputFormProps {
  onSubmit: (description: string, equipment: string, images: File[], clientName: string, clientAddress: string, clientNif: string, clientContact: string, interestedParty: string, technician: string, type: ReportType) => void;
  onScanImage: (file: File, currentData: any) => void;
  isLoading: boolean;
}

export const ReportInputForm: React.FC<ReportInputFormProps> = ({ onSubmit, onScanImage, isLoading }) => {
  const [description, setDescription] = useState('');
  const [equipment, setEquipment] = useState('Geofone, Câmera Térmica, Higrômetro Digital.');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientNif, setClientNif] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [interestedParty, setInterestedParty] = useState('');
  const [technician, setTechnician] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [reportType, setReportType] = useState<ReportType>('peritagem');
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
          onScanImage(file, { description, equipment, images, clientName, clientAddress, clientNif, clientContact, interestedParty, technician });
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
    if (description && clientName && technician) {
      onSubmit(description, equipment, images, clientName, clientAddress, clientNif, clientContact, interestedParty, technician, reportType);
    } else {
      alert('Por favor, preencha os dados obrigatórios.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-5xl mx-auto">
       
       <div className="text-center mb-8">
           <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Relatório Técnico Pericial</h2>
           <p className="text-gray-500 mt-2">Documentação técnica profissional para seguradoras e condomínios.</p>
       </div>

       {/* Tipo de Relatório */}
       <div className="flex justify-center gap-4 mb-6">
           <button 
                type="button" 
                onClick={() => setReportType('peritagem')}
                className={`flex-1 max-w-[200px] py-4 rounded-xl font-bold text-sm transition-all border-2 ${reportType === 'peritagem' ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
           >
               Diagnóstico / Peritagem
           </button>
           <button 
                type="button" 
                onClick={() => setReportType('finalizacao')}
                className={`flex-1 max-w-[200px] py-4 rounded-xl font-bold text-sm transition-all border-2 ${reportType === 'finalizacao' ? 'bg-green-600 text-white border-green-600 shadow-lg scale-105' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}`}
           >
               Final de Obra / Reparo
           </button>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Identificação</h3>
                    <div className="space-y-4">
                        <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Nome do Cliente" required />
                        <input type="text" value={clientNif} onChange={(e) => setClientNif(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="NIF/CNPJ" />
                        <input type="text" value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Contato" />
                        <input type="text" value={technician} onChange={(e) => setTechnician(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Perito Responsável" required />
                        <input type="text" value={interestedParty} onChange={(e) => setInterestedParty(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="Entidade Interessada (ex: Generali)" />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Contexto Técnico</h3>
                        <button type="button" onClick={() => scanInputRef.current?.click()} className="text-xs font-bold bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                             <SparklesIcon className="h-4 w-4" /> Digitalizar
                        </button>
                    </div>

                    <div className="space-y-5">
                        <input type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg" placeholder="Morada do Risco" />
                        
                        <textarea
                            rows={6}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none"
                            placeholder={reportType === 'peritagem' ? "Descreva as patologias observadas, sinais de humidade, vestígios de fuga..." : "Descreva os trabalhos efetuados, materiais substituídos e resultados dos testes de estanqueidade..."}
                            required
                        />

                        <input type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs" placeholder="Equipamentos Utilizados" />

                        <div 
                             className="border-2 border-gray-200 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 cursor-pointer"
                             onClick={() => fileInputRef.current?.click()}
                        >
                            <CameraIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 font-bold">Adicionar Fotos das Evidências</p>
                            <p className="text-xs text-gray-400">Fotos de fugas, reparos ou testes</p>
                        </div>
                        
                        <input ref={fileInputRef} type="file" className="sr-only" multiple accept="image/*" capture="environment" onChange={handleImageChange} />
                        
                        {imagePreviews.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {imagePreviews.map((src, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                        <img src={src} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(index)} className="absolute top-0 right-0 bg-red-600 text-white p-1 text-[8px] font-bold">X</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>
            </div>
       </div>

      <div className="flex justify-center pt-6">
        <button
            type="submit"
            disabled={isLoading || !description || !clientName}
            className={`w-full md:w-auto min-w-[350px] py-5 px-10 rounded-full shadow-2xl text-lg font-black text-white transition-all transform hover:-translate-y-1 ${reportType === 'peritagem' ? 'bg-primary' : 'bg-green-600'} disabled:opacity-50 flex items-center justify-center gap-3`}
        >
            {isLoading ? 'A Processar Dados...' : <><UploadIcon className="h-6 w-6" /> Gerar Laudo Profissional</>}
        </button>
      </div>
      <input ref={scanInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handleScanClick} />
    </form>
  );
};
