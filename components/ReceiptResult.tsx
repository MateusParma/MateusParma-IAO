
import React, { useRef, useState, useEffect } from 'react';
import type { ReceiptData, UserSettings, Currency } from '../types';
import { DownloadIcon } from './AppIcons';

declare const jspdf: any;
declare const html2canvas: any;

interface ReceiptResultProps {
  data: ReceiptData;
  userSettings: UserSettings;
  onReset: () => void;
  onAutoSave?: (data: ReceiptData) => void;
}

const formatCurrency = (value: number, currency: Currency) => {
    const locales: Record<Currency, string> = { 'BRL': 'pt-BR', 'USD': 'en-US', 'EUR': 'pt-PT' };
    return (value || 0).toLocaleString(locales[currency], { style: 'currency', currency });
};

export const ReceiptResult: React.FC<ReceiptResultProps> = ({ data, userSettings, onReset, onAutoSave }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [editedData, setEditedData] = useState<ReceiptData>(data);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    setIsPrinting(true);
    setTimeout(async () => {
        if (pdfRef.current) {
            const input = pdfRef.current;
            const { jsPDF } = jspdf;
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(`Recibo_${editedData.code}.pdf`);
            setIsPrinting(false);
        }
    }, 500);
  };

  return (
    <div className="animate-fade-in pb-10 w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 mb-6 flex justify-between items-center shadow-md border rounded-xl">
         <button onClick={onReset} className="text-gray-600 hover:text-primary font-bold flex items-center gap-2">← Voltar</button>
         <button onClick={handlePrint} className="bg-primary text-white px-6 py-2 rounded-lg shadow-lg hover:bg-secondary flex items-center font-bold active:scale-95 transition-transform">
            <DownloadIcon className="h-5 w-5 mr-2" /> Baixar PDF
         </button>
      </div>

      <div className="flex justify-center bg-gray-100 p-4 sm:p-10 rounded-2xl border">
        <div ref={pdfRef} className={`bg-white w-full max-w-[210mm] shadow-2xl ${isPrinting ? 'p-0' : 'p-8 sm:p-12'}`} style={{ minHeight: '148mm' }}>
            <div className="border-8 border-double border-primary p-8">
                <div className="flex justify-between mb-10 border-b pb-6">
                    <div>
                        <img src={userSettings.companyLogo} className="h-12 w-auto mb-2" alt="Logo" />
                        <h1 className="text-lg font-black uppercase text-gray-900">{userSettings.companyName}</h1>
                        <p className="text-[10px] text-gray-500">{userSettings.companyAddress}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-black text-gray-200">RECIBO</h2>
                        <p className="text-xl font-mono font-bold text-primary">Nº {editedData.code}</p>
                        <p className="text-xs text-gray-400">{editedData.date}</p>
                    </div>
                </div>

                <div className="space-y-8 py-4">
                    <div className="flex gap-4 border-b pb-2">
                        <span className="font-black text-gray-300 uppercase italic">Recebemos de</span>
                        <span className="text-xl font-bold border-none bg-transparent flex-grow">{editedData.clientName}</span>
                    </div>
                    <div className="flex gap-4 border-b pb-2">
                        <span className="font-black text-gray-300 uppercase italic">A quantia de</span>
                        <span className="text-2xl font-black text-primary">{formatCurrency(editedData.amount, editedData.currency)}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="font-black text-gray-300 uppercase italic">Referente a</span>
                        <p className="text-lg italic text-gray-700">{editedData.description}</p>
                    </div>
                </div>

                <div className="mt-20 flex justify-between items-end">
                    <div className="text-[10px] text-gray-400">Pagamento via: {editedData.paymentMethod}</div>
                    <div className="border-t-2 border-gray-900 pt-2 w-64 text-center font-black uppercase text-xs">Assinatura / Carimbo</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
