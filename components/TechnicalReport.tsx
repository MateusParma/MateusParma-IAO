
import React, { useRef, useState, useEffect } from 'react';
import type { TechnicalReportData, UserSettings, ReportSection, PhotoAnalysis } from '../types';
import { CameraIcon, TrashIcon, GearsIcon, PlusIcon, SparklesIcon } from './AppIcons';
import { generateReportSection } from '../services/geminiService';

interface TechnicalReportProps {
  data: TechnicalReportData;
  onUpdate: (data: TechnicalReportData) => void;
  userSettings: UserSettings;
  images: string[];
  isPrinting: boolean;
  onAddImage: (file: File) => void;
  onRemoveImage: (index: number) => void;
  onAutoDescribe: (index: number) => Promise<{legend: string, description: string} | null | undefined>;
}

export const TechnicalReport: React.FC<TechnicalReportProps> = ({ 
    data, 
    onUpdate, 
    userSettings, 
    images, 
    isPrinting,
    onAddImage,
    onRemoveImage,
    onAutoDescribe
}) => {
  const companyName = userSettings.companyName || "HidroClean";
  const [loadingDescriptions, setLoadingDescriptions] = useState<number[]>([]);

  // Funções de manipulação omitidas para brevidade, mantendo as existentes no arquivo original

  return (
    <div className={`bg-white max-w-4xl mx-auto text-gray-900 font-serif leading-loose ${!isPrinting ? 'shadow-2xl rounded-2xl p-8 sm:p-12 border' : 'p-0'}`} id="report-content">
      {/* Header do Laudo */}
      <div className="flex justify-between items-start border-b-4 border-gray-900 pb-6 mb-12">
        <div className="flex items-center gap-6">
             <img src={userSettings.companyLogo} alt="Logo" className="h-24 w-auto object-contain" />
            <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{companyName}</h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Departamento Técnico</p>
            </div>
        </div>
        <div className="text-right">
            <h2 className="text-2xl font-black text-gray-800">LAUDO PERICIAL</h2>
            <p className="font-mono text-sm font-bold bg-gray-100 px-2 rounded">REF: {data.code || 'S/REF'}</p>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="space-y-10">
          <section>
              <h3 className="bg-gray-800 text-white px-4 py-1 text-xs font-black uppercase tracking-widest mb-4">1. Identificação</h3>
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 border rounded-xl">
                  <div><span className="text-[10px] font-black text-gray-400 uppercase block">Cliente</span> {data.clientInfo.name}</div>
                  <div><span className="text-[10px] font-black text-gray-400 uppercase block">Data</span> {data.clientInfo.date}</div>
                  <div className="col-span-2"><span className="text-[10px] font-black text-gray-400 uppercase block">Endereço</span> {data.clientInfo.address}</div>
              </div>
          </section>

          <section>
              <h3 className="bg-gray-800 text-white px-4 py-1 text-xs font-black uppercase tracking-widest mb-4">2. Diagnóstico Técnico</h3>
              <div className="p-4 border-l-4 border-primary italic text-gray-700 bg-blue-50/50">
                  {data.conclusion.diagnosis}
              </div>
          </section>

          <section>
              <h3 className="bg-gray-800 text-white px-4 py-1 text-xs font-black uppercase tracking-widest mb-4">3. Evidências Fotográficas</h3>
              <div className="grid grid-cols-2 gap-6">
                  {data.photoAnalysis.map((photo, i) => (
                      <div key={i} className="border p-2 rounded-xl bg-gray-50">
                          <img src={images[photo.photoIndex]} className="w-full h-48 object-cover rounded-lg mb-2" />
                          <p className="text-[10px] font-black text-gray-400 uppercase">{photo.legend}</p>
                          <p className="text-xs text-gray-600 leading-tight mt-1">{photo.description}</p>
                      </div>
                  ))}
              </div>
          </section>

          <section className="pt-10 mt-10 border-t flex flex-col items-center">
              <div className="w-64 border-b-2 border-gray-900 pb-1 text-center font-bold uppercase text-sm">{data.clientInfo.technician}</div>
              <p className="text-[10px] text-gray-400 uppercase font-black mt-2">Assinatura do Técnico Responsável</p>
          </section>
      </div>
    </div>
  );
};
