
import React, { useRef, useState, useMemo } from 'react';
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

  // Cálculo do valor nominal do desconto para exibição
  const discountNominal = useMemo(() => {
    if (data.type === 'percentage') {
      return data.baseValue * (data.discountValue / 100);
    }
    return data.discountValue;
  }, [data.baseValue, data.discountValue, data.type]);

  const valueAfterDiscount = data.baseValue - discountNominal;

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
            pdf.save(`Desconto_${data.clientName.replace(/\s/g, '_')}.pdf`);
            setIsPrinting(false);
        }
    }, 500);
  };

  return (
    <div className="animate-fade-in pb-10 w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 mb-6 flex justify-between items-center shadow-sm border rounded-xl">
         <button onClick={onReset} className="text-gray-600 hover:text-primary font-bold">← Voltar</button>
         <button onClick={handlePrint} className="bg-orange-500 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-orange-600 flex items-center font-bold">
            <DownloadIcon className="h-5 w-5 mr-2" /> Baixar Vale Desconto
         </button>
      </div>

      <div className="flex justify-center">
        <div ref={pdfRef} className={`bg-gradient-to-br from-gray-900 to-primary w-full max-w-[210mm] shadow-2xl ${isPrinting ? 'p-0' : 'p-10'} rounded-3xl overflow-hidden relative border-8 border-orange-400/30`} style={{ minHeight: '148mm' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            
            <div className="relative z-10 border-2 border-orange-400/50 p-8 h-full flex flex-col justify-between rounded-xl">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <img src={userSettings.companyLogo} className="h-12 w-auto" alt="Logo" />
                        <h1 className="text-white font-black text-xl tracking-tighter uppercase">{userSettings.companyName}</h1>
                    </div>
                    <div className="text-right">
                        <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Vale de Cortesia Comercial</span>
                        <p className="text-orange-200 text-[10px] mt-2 font-mono uppercase tracking-widest">Ref: {data.code}</p>
                    </div>
                </div>

                <div className="text-center my-4">
                    <p className="text-orange-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Concedido Exclusivamente a</p>
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tight leading-none">{data.clientName}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] border-b border-white/5 pb-1">
                            <span className="text-gray-400 font-bold uppercase tracking-widest">Valor do Serviço:</span>
                            <span className="text-white font-bold">{format(data.baseValue)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-b border-white/5 pb-1">
                            <span className="text-orange-400 font-bold uppercase tracking-widest">Desconto ({data.type === 'percentage' ? `${data.discountValue}%` : 'Fixo'}):</span>
                            <span className="text-orange-500 font-black">-{format(discountNominal)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-b border-white/5 pb-1">
                            <span className="text-gray-300 font-bold uppercase tracking-widest">Valor Líquido:</span>
                            <span className="text-white font-bold">{format(valueAfterDiscount)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] border-b border-white/5 pb-1">
                            <span className="text-gray-400 font-bold uppercase tracking-widest">IVA ({data.taxRate}%):</span>
                            <span className="text-white font-bold">{format(data.taxAmount)}</span>
                        </div>
                    </div>
                    <div className="text-right md:border-l border-white/10 md:pl-8">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Final a Pagar</p>
                        <p className="text-5xl font-black text-orange-500 tracking-tighter leading-none">{format(data.finalValue)}</p>
                    </div>
                </div>

                <div className="flex justify-between items-end mt-6 pt-4 border-t border-white/10">
                    <div className="max-w-xs">
                        <p className="text-gray-400 text-[9px] uppercase font-bold mb-1 tracking-widest">Fundamentação Comercial</p>
                        <p className="text-white font-medium text-sm leading-tight italic">"{data.reason}"</p>
                    </div>
                    <div className="text-right text-[9px] text-gray-500 space-y-1">
                        <p>EMITIDO EM: {data.date}</p>
                        <p>VÁLIDO ATÉ: {data.expiryDate}</p>
                        <div className="flex items-center gap-2 justify-end mt-2">
                            <SparklesIcon className="h-4 w-4 text-orange-400" />
                            <span className="text-orange-400 font-black uppercase tracking-widest">Garantia HidroClean</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
