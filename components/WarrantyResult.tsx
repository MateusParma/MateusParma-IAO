
import React, { useRef, useState, useEffect } from 'react';
import type { WarrantyData, UserSettings } from '../types';
import { ShieldCheckIcon, DownloadIcon, CheckCircleIcon } from './AppIcons';

declare const jspdf: any;
declare const html2canvas: any;

interface WarrantyResultProps {
  data: WarrantyData;
  userSettings: UserSettings;
  onReset: () => void;
  onAutoSave?: (data: WarrantyData) => void;
}

export const WarrantyResult: React.FC<WarrantyResultProps> = ({ data, userSettings, onReset, onAutoSave }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    setIsPrinting(true);
    setTimeout(async () => {
        if (pdfRef.current) {
            const input = pdfRef.current;
            const { jsPDF } = jspdf;
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.75);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(`Garantia_${data.clientName.replace(/\s/g, '_')}.pdf`);
            setIsPrinting(false);
        }
    }, 500);
  };

  return (
    <div className="animate-fade-in pb-10 w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 mb-6 flex justify-between items-center shadow-md border rounded-xl">
         <button onClick={onReset} className="text-gray-600 hover:text-primary font-bold">← Voltar</button>
         <button onClick={handlePrint} className="bg-primary text-white px-6 py-2 rounded-lg shadow-lg hover:bg-secondary flex items-center font-bold active:scale-95 transition-transform">
            <DownloadIcon className="h-5 w-5 mr-2" /> Baixar PDF
         </button>
      </div>

      <div className="flex justify-center bg-gray-200 p-4 sm:p-10 rounded-2xl">
        <div ref={pdfRef} className={`bg-white w-full max-w-[210mm] shadow-2xl ${isPrinting ? 'p-0' : 'p-12 sm:p-20'}`} style={{ minHeight: '297mm' }}>
            <div className="border-[10px] border-double border-gray-900 p-10 h-full flex flex-col">
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-10">
                    <img src={userSettings.companyLogo} className="h-16 w-auto" alt="Logo" />
                    <div className="text-right">
                        <h1 className="text-4xl font-black text-gray-900 uppercase leading-none">TERMO DE<br/>GARANTIA</h1>
                        <p className="font-mono font-bold text-gray-400 mt-2">REF: {data.code || 'S/REF'}</p>
                    </div>
                </div>

                <div className="space-y-8 flex-grow">
                    <div className="bg-gray-50 p-6 rounded-xl border">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">Beneficiário</h3>
                        <p className="text-xl font-bold">{data.clientName}</p>
                        <p className="text-sm text-gray-600">{data.clientAddress}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase border-b-2 mb-4">Especificações do Serviço</h3>
                        <p className="italic text-gray-700 leading-relaxed">"{data.serviceDescription}"</p>
                    </div>

                    <div className="bg-primary/5 p-6 rounded-xl border-l-8 border-primary">
                        <p className="text-[10px] font-black text-primary uppercase mb-1">Período de Validade</p>
                        <p className="text-2xl font-black text-primary">{data.warrantyPeriod}</p>
                        <p className="text-xs text-gray-500 mt-1">Início em: {data.startDate}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase border-b-2 mb-4">Condições e Exclusões</h3>
                        <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{data.exclusions}</p>
                    </div>
                </div>

                <div className="mt-20 pt-10 border-t border-gray-200 text-center">
                    <div className="inline-block border-2 border-gray-900 p-4 rounded-lg">
                        <p className="font-black text-sm uppercase">{userSettings.companyName}</p>
                        <p className="text-[10px] font-bold text-red-600 uppercase mt-1">Garantia Certificada</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
