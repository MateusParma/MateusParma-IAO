
import React, { useState, useEffect } from 'react';
import { TrashIcon, CheckCircleIcon, XCircleIcon, PlusIcon, SparklesIcon } from './AppIcons';

interface ReviewExtractedDataPageProps {
  imagePreview: string | null;
  initialItems: string[];
  onConfirm: (items: string[]) => void;
  onCancel: () => void;
  mode: 'quote' | 'report';
}

export const ReviewExtractedDataPage: React.FC<ReviewExtractedDataPageProps> = ({ imagePreview, initialItems, onConfirm, onCancel, mode }) => {
  const [items, setItems] = useState<string[]>(initialItems);
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-xl shadow-sm">
         <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-primary" />
                Digitalização Inteligente
            </h2>
            <p className="text-gray-500 text-sm">Verifique os itens lidos da sua foto antes de gerar o {mode === 'quote' ? 'Orçamento' : 'Laudo'}.</p>
         </div>
         <div className="flex gap-3">
             <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
                 Cancelar
             </button>
             <button 
                onClick={() => onConfirm(items)} 
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary shadow-md font-bold flex items-center transition transform hover:-translate-y-0.5"
                disabled={items.length === 0}
             >
                 <CheckCircleIcon className="h-5 w-5 mr-2" />
                 Confirmar e Gerar
             </button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden bg-gray-50 border-x border-b border-gray-200 rounded-b-xl">
          
          {/* Left: Image Preview */}
          <div className="lg:w-1/2 p-6 bg-gray-200 flex items-center justify-center overflow-hidden relative">
              <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm z-10">
                  Imagem Original
              </div>
              {imagePreview ? (
                  <img src={imagePreview} alt="Documento Digitalizado" className="max-w-full max-h-full object-contain shadow-xl rounded-lg" />
              ) : (
                  <div className="text-gray-400">Nenhuma imagem disponível</div>
              )}
          </div>

          {/* Right: Extracted List */}
          <div className="lg:w-1/2 flex flex-col bg-white">
               <div className="p-4 bg-blue-50 border-b border-blue-100">
                   <div className="flex gap-2">
                       <input 
                          type="text" 
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                          placeholder="Adicionar item manualmente..."
                          className="flex-grow p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                       />
                       <button onClick={handleAddItem} className="bg-primary text-white px-4 rounded-lg hover:bg-secondary transition">
                           <PlusIcon className="h-6 w-6" />
                       </button>
                   </div>
               </div>

               <div className="flex-grow overflow-y-auto p-4 space-y-3">
                   {items.length === 0 ? (
                       <div className="text-center text-gray-400 mt-10">
                           <p>Nenhum item detectado.</p>
                           <p className="text-sm">Adicione itens manualmente acima.</p>
                       </div>
                   ) : (
                       items.map((item, index) => (
                           <div key={index} className="flex items-center gap-3 group">
                               <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                   {index + 1}
                               </div>
                               <input 
                                  type="text" 
                                  value={item}
                                  onChange={(e) => handleItemChange(index, e.target.value)}
                                  className="flex-grow p-3 bg-gray-50 border border-transparent hover:border-gray-300 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-lg transition outline-none text-gray-800"
                               />
                               <button 
                                  onClick={() => handleRemoveItem(index)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition opacity-0 group-hover:opacity-100"
                               >
                                   <TrashIcon className="h-5 w-5" />
                               </button>
                           </div>
                       ))
                   )}
               </div>
               
               <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
                   Total de {items.length} itens identificados.
               </div>
          </div>
      </div>
    </div>
  );
};
