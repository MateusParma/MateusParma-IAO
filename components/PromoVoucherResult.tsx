
import React, { useRef, useState } from 'react';
import type { PromoVoucherData, UserSettings } from '../types';
import { DownloadIcon, SparklesIcon, CheckCircleIcon } from './AppIcons';

declare const jspdf: any;
declare const html2canvas: any;

interface PromoVoucherResultProps {
  data: PromoVoucherData;
  userSettings: UserSettings;
  onReset: () => void;
}

export const PromoVoucherResult: React.FC<PromoVoucherResultProps> = ({ data, userSettings, onReset }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    setIsPrinting(true);
    setTimeout(async () => {
        if (pdfRef.current) {
            const input = pdfRef.current;
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('l', 'mm', 'a5');
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Voucher_VIP_${data.clientName.replace(/\s/g, '_')}.pdf`);
            setIsPrinting(false);
        }
    }, 500);
  };

  return (
    <div className="animate-fade-in pb-10 w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 mb-6 flex justify-between items-center shadow-sm border rounded-xl">
         <button onClick={onReset} className="text-gray-600 hover:text-primary font-bold">← Voltar</button>
         <button onClick={handlePrint} className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-yellow-600 flex items-center font-bold gap-2">
            <DownloadIcon className="h-5 w-5" /> Baixar Voucher VIP
         </button>
      </div>

      <div className="flex justify-center">
        <div ref={pdfRef} className={`bg-white w-full max-w-[210mm] shadow-2xl ${isPrinting ? 'p-0' : 'p-6 sm:p-10'} rounded-[3rem] overflow-hidden relative border-[12px] border-yellow-400`} style={{ minHeight: '148mm' }}>
            
            {/* Design de "Ticket" */}
            <div className="absolute top-0 bottom-0 left-1/4 border-l-2 border-dashed border-gray-200"></div>
            
            <div className="relative z-10 h-full flex flex-col md:flex-row">
                
                {/* Lado Esquerdo (Stub) */}
                <div className="md:w-1/4 p-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
                    <div>
                        <img src={userSettings.companyLogo} className="h-10 w-auto mb-4" alt="Logo" />
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">VIP PASS</p>
                        <p className="text-xs font-bold text-gray-900 mt-1">{data.code}</p>
                    </div>
                    <div className="mt-8">
                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Válido até</p>
                        <p className="text-xs font-black text-orange-600">{data.expiryDate}</p>
                    </div>
                </div>

                {/* Lado Direito (Main) */}
                <div className="md:w-3/4 p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-yellow-600 font-black text-xs uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                    <SparklesIcon className="h-4 w-4" /> Oferta Exclusiva
                                </h3>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none mb-4 uppercase">{data.offerTitle}</h2>
                            </div>
                            <div className="bg-gray-900 text-white p-3 rounded-2xl transform rotate-12 shadow-xl">
                                <p className="text-[10px] font-black uppercase leading-none">VIP</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-widest">Para: {data.clientName || 'Nosso Cliente VIP'}</p>
                            <div className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-100 shadow-inner">
                                <p className="text-2xl font-bold text-gray-800 leading-tight italic">"{data.discountDescription}"</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Condições</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed italic">{data.conditions}</p>
                        
                        <div className="mt-6 flex justify-between items-end">
                            <div>
                                <p className="text-xs font-black text-gray-900 uppercase">{userSettings.companyName}</p>
                                <p className="text-[9px] text-gray-500">{userSettings.companyAddress}</p>
                            </div>
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircleIcon className="h-5 w-5" />
                                <span className="text-[10px] font-black uppercase">Documento Autêntico</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Círculos de "Furo de Ticket" */}
            <div className="absolute top-1/2 -left-6 w-12 h-12 bg-gray-100 rounded-full transform -translate-y-1/2"></div>
            <div className="absolute top-1/2 -right-6 w-12 h-12 bg-gray-100 rounded-full transform -translate-y-1/2"></div>
        </div>
      </div>
    </div>
  );
};
