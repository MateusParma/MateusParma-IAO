
import React from 'react';
import { SparklesIcon } from './AppIcons';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
      <div className="relative flex justify-center items-center mb-6">
          {/* Anel giratório externo */}
          <div className="absolute animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
          
          {/* Círculo interno estático/pulsante */}
          <div className="relative inline-flex rounded-full h-16 w-16 bg-blue-50 items-center justify-center shadow-inner">
            <SparklesIcon className="h-8 w-8 text-primary animate-pulse" />
          </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Processando com IA...</h2>
      <p className="mt-3 text-gray-500 max-w-md mx-auto leading-relaxed">
        Estamos analisando os dados e fotos para gerar um documento profissional e detalhado. Por favor, aguarde.
      </p>
    </div>
  );
};
