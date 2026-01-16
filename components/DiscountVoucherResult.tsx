
import React, { useRef, useState } from 'react';
import type { DiscountVoucherData, UserSettings } from '../types';
import { DownloadIcon, SparklesIcon } from './AppIcons';

declare const jspdf: any;
declare const html2canvas: any;

interface DiscountVoucherResultProps {
  data: DiscountVoucherData;
  userSettings: UserSettings;
  onReset: () => void;
}

export const DiscountVoucherResult: React.FC<DiscountVoucherResultProps> = ({ data, userSettings, onReset }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const format = (val: number) => val.toLocaleString('pt-PT', { style: 'currency', currency: data.currency });

  const handlePrint = async () => {
    setIsPrinting(true);
    setTimeout(async () => {
        if (pdfRef.current) {
            const input = pdfRef.current;
            const { jsPDF } = jspdf;
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const pdf = new jsPDF('l', 'mm', 'a5');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(`ValeDesconto_${data.clientName.replace(/\s/g, '_')}.pdf`);
            setIsPrinting(false);
        }
    }, 500);
  };

  return (
    <div className="animate-fade-in pb-10 w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 mb-6 flex justify-between items-center shadow-md border rounded-xl">
         <button onClick={onReset} className="text-gray-600 hover:text-primary font-bold">← Voltar</button>
         <button onClick={handlePrint} className="bg-orange-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-orange-600 flex items-center font-bold active:scale-95 transition-transform">
            <DownloadIcon className="h-5 w-5 mr-2" /> Baixar PDF
         </button>
      </div>

      <div className="flex justify-center bg-gray-100 p-4 sm:p-10 rounded-2xl">
        <div ref={pdfRef} className={`bg-gradient-to-br from-gray-900 to-primary w-full max-w-[210mm] shadow-2xl ${isPrinting ? 'p-0' : 'p-10'} rounded-3xl relative border-8 border-orange-400/30`}>
            <div className="relative z-10 border-2 border-orange-400/50 p-8 rounded-xl flex flex-col justify-between" style={{ minHeight: '100mm' }}>
                <div className="flex justify-between items-start">
                    <img src={userSettings.companyLogo} className="h-10 w-auto" alt="Logo" />
                    <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">Vale de Desconto</span>
                </div>

                <div className="text-center py-6">
                    <p className="text-orange-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Concedido a</p>
                    <h2 className="text-4xl font-black text-white italic">{data.clientName}</h2>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-md border border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold">Valor Original: {format(data.baseValue)}</p>
                        <p className="text-orange-500 text-xl font-black italic">Desconto Aplicado: {data.type === 'percentage' ? `${data.discountValue}%` : format(data.discountValue)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Total Final</p>
                        <p className="text-4xl font-black text-white">{format(data.finalValue)}</p>
                    </div>
                </div>

                <div className="flex justify-between items-end mt-6 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    <span>Validade: {data.expiryDate}</span>
                    <span>Ref: {data.code}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
