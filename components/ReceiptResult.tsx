
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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (onAutoSave) {
          setSaveStatus('saving');
          const timer = setTimeout(() => { onAutoSave(editedData); setSaveStatus('saved'); }, 1000); 
          return () => clearTimeout(timer);
      }
  }, [editedData, onAutoSave]);

  const handlePrint = async () => {
    setIsPrinting(true);
    setTimeout(async () => {
        if (pdfRef.current) {
            const input = pdfRef.current;
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const canvas = await html2canvas(input, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Recibo_${editedData.code}.pdf`);
            setIsPrinting(false);
        }
    }, 500);
  };

  return (
    <div className="animate-fade-in pb-10 w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 mb-6 flex justify-between items-center shadow-sm border rounded-xl">
         <div className="flex items-center gap-4">
             <button onClick={onReset} className="text-gray-600 hover:text-primary font-bold flex items-center gap-2">
                <span className="text-xl">←</span> Voltar
             </button>
             <span className="text-xs font-mono text-gray-400 uppercase">{saveStatus === 'saving' ? 'A gravar...' : 'Gravado'}</span>
         </div>
         <button onClick={handlePrint} className="bg-primary text-white px-6 py-2 rounded-lg shadow-lg hover:bg-secondary flex items-center font-bold transition-all transform active:scale-95">
            <DownloadIcon className="h-5 w-5 mr-2" /> Descarregar PDF
         </button>
      </div>

      <div className="flex justify-center bg-gray-200 p-2 sm:p-10 rounded-2xl border border-gray-300">
        <div ref={pdfRef} className={`bg-white w-full max-w-[210mm] shadow-2xl ${isPrinting ? 'p-0' : 'p-8 sm:p-16'}`} style={{ minHeight: '148mm' }}>
            <div className="border-[6px] border-double border-primary p-8 relative">
                {/* Cabeçalho */}
                <div className="flex justify-between items-start mb-10 border-b-2 border-gray-100 pb-8">
                    <div className="flex flex-col gap-4">
                        {userSettings.companyLogo ? (
                            <img src={userSettings.companyLogo} className="h-14 w-auto object-contain self-start" alt="Logo" />
                        ) : (
                            <div className="h-12 w-24 bg-gray-100 flex items-center justify-center text-[8px] text-gray-400 border border-dashed border-gray-300">LOGO</div>
                        )}
                        <div>
                            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">{userSettings.companyName}</h1>
                            <p className="text-[10px] text-gray-500 mt-1 font-medium">{userSettings.companyAddress}</p>
                            <p className="text-[10px] font-bold text-primary">NIF: {userSettings.companyTaxId}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-primary text-white px-4 py-1 text-xs font-bold uppercase tracking-widest inline-block mb-2">Documento de Quitação</div>
                        <h2 className="text-5xl font-black text-gray-900 opacity-5 absolute right-8 top-16 select-none pointer-events-none">RECIBO</h2>
                        {isPrinting ? (
                           <p className="text-xl font-mono font-bold text-gray-800">Nº {editedData.code}</p>
                        ) : (
                           <input 
                              className="text-right text-xl font-mono font-bold text-gray-800 bg-blue-50 border-b border-primary outline-none"
                              value={editedData.code} 
                              onChange={e => setEditedData({...editedData, code: e.target.value})}
                           />
                        )}
                        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{editedData.date}</p>
                    </div>
                </div>

                {/* Corpo do Recibo */}
                <div className="space-y-10">
                    <div className="relative">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-lg font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Recebemos de</span>
                            <div className="flex-grow border-b-2 border-dotted border-gray-300 pb-1">
                                {isPrinting ? (
                                   <span className="text-2xl font-black text-gray-900 uppercase italic px-2">{editedData.clientName}</span>
                                ) : (
                                   <input 
                                      className="w-full text-2xl font-black text-gray-900 uppercase italic px-2 bg-blue-50 outline-none"
                                      value={editedData.clientName}
                                      onChange={e => setEditedData({...editedData, clientName: e.target.value})}
                                   />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-lg font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">A Quantia de</span>
                            <div className="flex-grow bg-gray-50 p-4 border-2 border-gray-100 rounded-xl text-center shadow-inner relative">
                                {isPrinting ? (
                                   <span className="text-4xl font-black text-primary">
                                       {formatCurrency(editedData.amount, editedData.currency)}
                                   </span>
                                ) : (
                                   <div className="flex justify-center items-center gap-2">
                                      <input 
                                         type="number"
                                         className="text-4xl font-black text-primary bg-blue-100 rounded px-2 w-48 text-center outline-none"
                                         value={editedData.amount}
                                         onChange={e => setEditedData({...editedData, amount: Number(e.target.value)})}
                                      />
                                      <span className="text-4xl font-black text-primary">{editedData.currency}</span>
                                   </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mb-8">
                            <span className="text-lg font-bold text-gray-400 uppercase tracking-widest">Referente a</span>
                            <div className="bg-white border-b-2 border-gray-100 py-2">
                                {isPrinting ? (
                                   <p className="text-lg font-medium text-gray-700 leading-relaxed italic border-l-4 border-primary pl-4">
                                       {editedData.description}
                                   </p>
                                ) : (
                                   <textarea 
                                      className="w-full text-lg font-medium text-gray-700 leading-relaxed italic border-l-4 border-primary pl-4 bg-blue-50 outline-none"
                                      value={editedData.description}
                                      onChange={e => setEditedData({...editedData, description: e.target.value})}
                                      rows={2}
                                   />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rodapé do Recibo */}
                    <div className="grid grid-cols-2 gap-12 pt-8">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Método de Pagamento</p>
                                {isPrinting ? (
                                   <div className="bg-gray-50 px-4 py-2 rounded border border-gray-100 font-bold text-gray-700">
                                       {editedData.paymentMethod}
                                   </div>
                                ) : (
                                   <select 
                                      className="w-full bg-blue-50 px-4 py-2 rounded border border-primary font-bold text-gray-700 outline-none"
                                      value={editedData.paymentMethod}
                                      onChange={e => setEditedData({...editedData, paymentMethod: e.target.value})}
                                   >
                                      <option value="Transferência Bancária">Transferência</option>
                                      <option value="MBWay">MBWay</option>
                                      <option value="Dinheiro">Dinheiro</option>
                                      <option value="Cartão">Cartão</option>
                                   </select>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight">
                                Este documento serve como comprovativo de quitação para os fins devidos, referente aos serviços acima descritos. Documento emitido digitalmente.
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-center relative">
                            {/* Carimbo Digital */}
                            <div className="border-4 border-primary/40 rounded-full w-32 h-32 flex flex-col items-center justify-center transform -rotate-12 select-none pointer-events-none">
                                <div className="text-[8px] font-black text-primary/60 uppercase tracking-tighter text-center">
                                    {userSettings.companyName.split(' ')[0]}<br/>
                                    VALIDADO<br/>
                                    DIGITALMENTE
                                </div>
                                <div className="border-t border-primary/30 w-20 my-1"></div>
                                <div className="text-[6px] font-mono text-primary/40">{editedData.date}</div>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 mt-4 border-t-2 border-gray-900 pt-2 w-full text-center">AUTENTICAÇÃO DIGITAL</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Elemento decorativo inferior */}
            <div className="mt-8 flex justify-center opacity-30">
                <p className="text-[8px] uppercase tracking-[0.5em] text-gray-400 font-bold">Processado por Inteligência Artificial • {userSettings.companyName}</p>
            </div>
        </div>
      </div>
    </div>
  );
};
