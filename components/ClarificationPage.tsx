
import React, { useState } from 'react';
import { SparklesIcon, CheckCircleIcon, XCircleIcon } from './AppIcons';

interface ClarificationPageProps {
  questions: string[];
  onConfirm: (answer: string) => void;
  onCancel: () => void;
}

export const ClarificationPage: React.FC<ClarificationPageProps> = ({ questions, onConfirm, onCancel }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onConfirm(answer);
    }
  };

  // Ensure questions is array
  const displayQuestions = Array.isArray(questions) ? questions : [questions];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                    <SparklesIcon className="h-12 w-12 text-white" />
                </div>
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold mb-2">Ajude a IA a ser mais precisa</h2>
                    <p className="text-blue-100 text-lg max-w-2xl">
                        A descrição inicial está um pouco vaga. Para gerar um orçamento profissional com valores reais, precisamos de alguns detalhes extras.
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column: The Questions */}
            <div className="p-8 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide mb-6 flex items-center">
                    <span className="bg-orange-100 text-orange-600 p-1.5 rounded mr-3">❓</span>
                    O que faltou informar:
                </h3>
                
                <ul className="space-y-4">
                    {displayQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start group">
                             <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white border-2 border-orange-300 text-orange-500 flex items-center justify-center font-bold text-xs mt-0.5 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                 {idx + 1}
                             </div>
                             <p className="ml-3 text-gray-700 font-medium leading-relaxed">{q}</p>
                        </li>
                    ))}
                </ul>

                <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <strong>Por que isso é importante?</strong><br/>
                    Sem saber quantidades (m², unidades) ou o tipo exato de serviço (instalar vs reparar), o preço pode variar muito.
                </div>
            </div>

            {/* Right Column: The Answer Form */}
            <div className="p-8 flex flex-col justify-center">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="answer" className="block text-sm font-bold text-gray-700 mb-2">
                            Sua Resposta Complementar
                        </label>
                        <textarea
                            id="answer"
                            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-blue-50 outline-none transition text-gray-800 text-lg shadow-sm"
                            rows={6}
                            placeholder="Ex: São 20 metros quadrados de parede. Para a torneira, é apenas a substituição de uma antiga..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            autoFocus
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition font-bold flex items-center justify-center"
                        >
                            <XCircleIcon className="h-5 w-5 mr-2" />
                            Voltar / Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!answer.trim()}
                            className="flex-1 px-6 py-4 bg-primary text-white rounded-xl hover:bg-secondary hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-bold flex items-center justify-center transform active:scale-95"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Continuar Orçamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
