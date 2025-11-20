
import React, { useState } from 'react';
import { SparklesIcon } from './AppIcons';

interface ClarificationModalProps {
  isOpen: boolean;
  questions: string[]; // Changed from single string to array
  onConfirm: (answer: string) => void;
  onCancel: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({ isOpen, questions, onConfirm, onCancel }) => {
  const [answer, setAnswer] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onConfirm(answer);
      setAnswer('');
    }
  };

  // Fallback if for some reason questions is not an array (legacy safety)
  const displayQuestions = Array.isArray(questions) ? questions : [questions];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                    <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Vamos detalhar melhor?</h3>
                    <p className="text-blue-100 text-sm">Para um orçamento exato, a IA precisa de mais precisão.</p>
                </div>
            </div>
        </div>

        <div className="p-6">
             {/* Questions List */}
             <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                <p className="text-sm font-bold text-orange-800 mb-2 uppercase tracking-wide">O que faltou informar:</p>
                <ul className="space-y-2">
                    {displayQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start text-gray-700 text-sm font-medium">
                             <span className="mr-2 text-orange-500 mt-0.5">❓</span>
                             {q}
                        </li>
                    ))}
                </ul>
             </div>
            
            <form onSubmit={handleSubmit}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Sua Resposta Complementar</label>
                <textarea
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary mb-2 outline-none transition resize-none text-gray-800"
                    rows={3}
                    placeholder="Ex: Instalar 2 unidades; Pintar 30m2 de parede..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    autoFocus
                />
                
                {/* Pro Tip Footer inside form */}
                <div className="mb-6 flex items-center gap-2 text-xs text-gray-400 bg-gray-100 p-2 rounded-lg">
                     <span className="font-bold bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">DICA</span>
                     <span>Tente sempre usar a estrutura: <strong className="text-gray-600">Ação + Item + Quantidade</strong>.</span>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition text-sm font-semibold"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!answer.trim()}
                        className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-bold shadow-md transform hover:-translate-y-0.5"
                    >
                        Responder e Gerar
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
