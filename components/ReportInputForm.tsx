
import React, { useState, useRef } from 'react';
import { CameraIcon, UploadIcon, ClipboardDocumentIcon } from './AppIcons';

interface ReportInputFormProps {
  onSubmit: (description: string, equipment: string, images: File[], clientName: string, clientAddress: string, clientNif: string, clientContact: string, interestedParty: string, technician: string) => void;
  isLoading: boolean;
}

export const ReportInputForm: React.FC<ReportInputFormProps> = ({ onSubmit, isLoading }) => {
  const [description, setDescription] = useState('');
  const [equipment, setEquipment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientNif, setClientNif] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [interestedParty, setInterestedParty] = useState('');
  const [technician, setTechnician] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray: File[] = Array.from(event.target.files);
      setImages(prevImages => [...prevImages, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };
  
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
      onSubmit(description, equipment, images, clientName, clientAddress, clientNif, clientContact, interestedParty, technician);
    } else {
      alert('Por favor, preencha os dados do cliente, técnico responsável e a descrição do sinistro.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-5xl mx-auto">
       
       <div className="text-center mb-8">
           <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Novo Laudo Técnico</h2>
           <p className="text-gray-500 mt-2">Gerador especializado para sinistros e perícias (Padrão Seguradora).</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Participants */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center mb-4 border-b pb-2 border-gray-100">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Envolvidos</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Segurado / Cliente</label>
                            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none text-sm" placeholder="Nome Completo" required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">NIF</label>
                                <input type="text" value={clientNif} onChange={(e) => setClientNif(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none text-sm" placeholder="123456789" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Contato</label>
                                <input type="text" value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none text-sm" placeholder="Tel/Email" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Perito Responsável</label>
                            <input type="text" value={technician} onChange={(e) => setTechnician(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none text-sm font-medium" placeholder="Seu Nome" required />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Outro Interessado (Opcional)</label>
                             <input type="text" value={interestedParty} onChange={(e) => setInterestedParty(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none text-sm" placeholder="Condomínio, Vizinho..." />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Technical Details */}
            <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                     <div className="flex items-center mb-4 border-b pb-2 border-gray-100">
                        <div className="bg-orange-100 p-2 rounded-lg mr-3">
                            <ClipboardDocumentIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Detalhes da Ocorrência</h3>
                    </div>

                    <div className="flex-grow space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Local do Risco (Morada Completa)</label>
                            <input type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none" placeholder="Ex: Av. da Liberdade, 100, Lisboa" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Descrição Técnica da Anomalia
                            </label>
                            <textarea
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none resize-none"
                            placeholder="Descreva o sinistro: infiltração ativa, ruptura de cano, danos visíveis, testes realizados..."
                            required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Equipamentos Utilizados (Opcional)
                            </label>
                            <input
                            type="text"
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition outline-none"
                            placeholder="Ex: Geofone, Câmera Térmica, Higrômetro..."
                            />
                        </div>

                        <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-3">Evidências Fotográficas</label>
                             <div 
                             className="group relative flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 hover:border-primary transition cursor-pointer"
                             onClick={() => fileInputRef.current?.click()}
                             >
                                <div className="space-y-2 text-center">
                                    <div className="mx-auto h-12 w-12 bg-gray-100 group-hover:bg-white rounded-full flex items-center justify-center transition">
                                        <CameraIcon className="h-6 w-6 text-gray-400 group-hover:text-primary" />
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Adicionar Fotos
                                    </div>
                                </div>
                             </div>
                             <input
                             ref={fileInputRef}
                             type="file"
                             className="sr-only"
                             multiple
                             accept="image/*"
                             capture="environment"
                             onChange={handleImageChange}
                             />
                             
                             {imagePreviews.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {imagePreviews.map((src, index) => (
                                    <div key={index} className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 group">
                                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 bg-red-500 bg-opacity-50 opacity-0 group-hover:opacity-100 text-white font-bold flex items-center justify-center">✕</button>
                                    </div>
                                    ))}
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
            disabled={isLoading || !description || !clientName || !technician}
            className="w-full md:w-auto md:min-w-[300px] mx-auto flex justify-center items-center py-4 px-8 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                 <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Gerando Laudo...
                </span>
            ) : (
                <>
                    <UploadIcon className="h-6 w-6 mr-2" />
                    Gerar Laudo Técnico
                </>
            )}
        </button>
      </div>
    </form>
  );
};
