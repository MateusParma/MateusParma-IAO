
import React, { useState, useRef } from 'react';
import { CameraIcon, UploadIcon } from './AppIcons';

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
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
       <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
           <h2 className="text-xl font-bold text-primary mb-2">Gerador de Laudo Técnico (Seguradoras)</h2>
           <p className="text-sm text-gray-600">Preencha os dados abaixo para gerar um relatório pericial focado em sinistros, infiltrações e danos por água. Este laudo será formatado para aprovação em seguradoras.</p>
       </div>

       <div className="p-4 border border-gray-200 rounded-lg bg-white">
         <h3 className="text-lg font-semibold text-gray-800 mb-4">Dados do Sinistro e Envolvidos</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Segurado / Cliente</label>
                <input id="clientName" type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Ex: Maria Santos" required />
            </div>
            <div>
                <label htmlFor="clientContact" className="block text-sm font-medium text-gray-700 mb-1">Contato (Tel/Email)</label>
                <input id="clientContact" type="text" value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Ex: 912 345 678" />
            </div>
            <div>
                <label htmlFor="clientNif" className="block text-sm font-medium text-gray-700 mb-1">NIF do Cliente</label>
                <input id="clientNif" type="text" value={clientNif} onChange={(e) => setClientNif(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Ex: 123456789" />
            </div>
            <div>
                 <label htmlFor="interestedParty" className="block text-sm font-medium text-gray-700 mb-1">Outro Interessado (Opcional)</label>
                 <input id="interestedParty" type="text" value={interestedParty} onChange={(e) => setInterestedParty(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Ex: Condomínio, Vizinho do 3ºEsq" />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-1">Local do Risco (Morada)</label>
                <input id="clientAddress" type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Ex: Av. da Liberdade, 100, Lisboa" />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="technician" className="block text-sm font-medium text-gray-700 mb-1">Técnico / Perito Responsável</label>
                <input id="technician" type="text" value={technician} onChange={(e) => setTechnician(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition" placeholder="Seu Nome" required />
            </div>
         </div>
       </div>

      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label htmlFor="description" className="block text-lg font-semibold text-gray-800 mb-2">
          Descrição da Ocorrência / Anomalia
        </label>
        <p className="text-xs text-gray-500 mb-2">Descreva o que encontrou: manchas, goteiras, testes realizados, e o que causou o problema.</p>
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition"
          placeholder="Ex: Fui chamado para verificar infiltração no teto da cozinha do vizinho de baixo. Realizei teste de pressão e constatei ruptura na tubagem de água quente..."
          required
        />
      </div>

      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label htmlFor="equipment" className="block text-lg font-semibold text-gray-800 mb-2">
          Equipamentos Utilizados (Opcional)
        </label>
        <input
          id="equipment"
          type="text"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition"
          placeholder="Ex: Geofone Digital, Câmera Termográfica, Manômetro de Pressão, Higrômetro..."
        />
      </div>

      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-lg font-semibold text-gray-800 mb-2">Evidências Fotográficas</label>
        <div 
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-primary transition bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-1 text-center">
            <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600 justify-center">
              <span className="relative rounded-md font-medium text-primary hover:text-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                <span>Adicionar Fotos</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Essenciais para o relatório.</p>
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
      </div>

      {imagePreviews.length > 0 && (
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Fotos Anexadas:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imagePreviews.map((src, index) => (
              <div key={index} className="relative group">
                <img src={src} alt={`Preview ${index}`} className="h-28 w-full object-cover rounded-lg shadow-md" />
                 <button 
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  aria-label="Remover imagem"
                 >
                   &#x2715;
                 </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !description || !clientName || !technician}
        className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-primary hover:bg-secondary disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
      >
        <UploadIcon className="h-6 w-6 mr-2" />
        Gerar Laudo Técnico Profissional
      </button>
    </form>
  );
};
