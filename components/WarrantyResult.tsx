
import React, { useRef, useState, useEffect } from 'react';
import type { WarrantyData, UserSettings } from '../types';
import { ShieldCheckIcon, DownloadIcon, CheckCircleIcon } from './AppIcons';

// Make jspdf and html2canvas available in the scope
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
  const [editedData, setEditedData] = useState<WarrantyData>(data);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (onAutoSave) {
          setSaveStatus('saving');
          const timer = setTimeout(() => {
              onAutoSave(editedData);
              setSaveStatus('saved');
          }, 1000); 
          return () => clearTimeout(timer);
      }
  }, [editedData, onAutoSave]);

  const handlePrint = async () => {
    setIsPrinting(true);
    setTimeout(async () => {
        if (pdfRef.current) {
            try {
                const input = pdfRef.current;
                const originalWidth = input.style.width;
                input.style.width = '794px';
                input.style.minWidth = '794px';

                const { jsPDF } = jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const margin = 15;
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const usableWidth = pdfWidth - (margin * 2);
                const sections = Array.from(input.querySelectorAll('.pdf-section')) as HTMLElement[];
                let cursorY = margin;

                const canvasOptions = {
                    scale: 1.5, // Optimize for weight
                    useCORS: true, 
                    windowWidth: 794,
                    backgroundColor: '#ffffff'
                };

                for (const section of sections) {
                    const canvas = await html2canvas(section, canvasOptions);
                    // COMPRESSION: JPEG with 0.7 quality
                    const imgData = canvas.toDataURL('image/jpeg', 0.7);
                    const imgWidth = canvas.width;
                    const imgHeight = canvas.height;
                    const pdfImageHeight = (imgHeight * usableWidth) / imgWidth;

                    if (cursorY + pdfImageHeight > pdfHeight - margin) {
                        pdf.addPage();
                        cursorY = margin;
                    }
                    pdf.addImage(imgData, 'JPEG', margin, cursorY, usableWidth, pdfImageHeight, undefined, 'FAST');
                    cursorY += pdfImageHeight + 7;
                }

                const safeName = (editedData.clientName || 'Garantia').replace(/[^a-z0-9]/gi, '_').substring(0, 20);
                pdf.save(`Garantia_${safeName}.pdf`);
                input.style.width = originalWidth;
            } finally { setIsPrinting(false); }
        }
    }, 800);
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="sticky top-0 z-50 bg-gray-100/90 backdrop-blur-sm p-4 mb-6 flex justify-between items-center shadow-sm border-b border-gray-200">
         <div className="flex items-center gap-4">
             <button onClick={onReset} className="text-gray-600 hover:text-primary font-medium flex items-center">← Voltar</button>
             <span className="text-xs text-gray-400">{saveStatus === 'saving' ? 'Salvando...' : 'Salvo'}</span>
         </div>
         <button onClick={handlePrint} className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-secondary flex items-center font-bold"><DownloadIcon className="h-5 w-5 mr-2" /> Baixar PDF</button>
      </div>
      <div className="flex justify-center">
        <div ref={pdfRef} className={`bg-white w-full max-w-4xl ${isPrinting ? 'p-0 shadow-none' : 'p-10 shadow-2xl rounded-xl border border-gray-200'}`} style={{ minHeight: '297mm', boxSizing: 'border-box' }}>
            <div className="w-full h-full flex flex-col">
                <div className="pdf-section flex justify-between items-end border-b-4 border-gray-900 pb-6 mb-10">
                    <div className="flex items-center gap-6">
                        {userSettings.companyLogo ? ( <img src={userSettings.companyLogo} alt="Logo" className="h-24 object-contain" /> ) : ( <div className="h-24 w-32 bg-gray-100 flex items-center justify-center text-gray-400 font-bold border border-gray-300">LOGO</div> )}
                        <div><h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{userSettings.companyName}</h1><div className="text-sm text-gray-600 mt-2 leading-tight"><p>{userSettings.companyAddress}</p><p className="font-medium">NIF: {userSettings.companyTaxId}</p></div></div>
                    </div>
                    <div className="text-right"><div className="bg-gray-900 text-white px-4 py-1 text-xs font-bold uppercase tracking-widest mb-2 inline-block">Documento Oficial</div><h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">Termo de<br/>Garantia</h2><p className="text-sm font-mono font-bold mt-2 text-gray-500">REF: {editedData.code || 'GAR-000'}</p></div>
                </div>
                <div className="space-y-8 font-serif text-gray-900 flex-grow">
                    <div className="pdf-section"><h3 className="text-base font-bold text-white bg-gray-800 px-3 py-1 uppercase mb-4 inline-block tracking-wide">1. Identificação e Objeto</h3><div className="bg-gray-50 p-5 border-l-4 border-gray-400 text-sm text-gray-800"><div className="grid grid-cols-3 gap-4 mb-3 border-b border-gray-200 pb-3"><div className="col-span-2"><span className="font-bold text-gray-500 uppercase text-xs block">Cliente</span> {editedData.clientName}</div><div><span className="font-bold text-gray-500 uppercase text-xs block">NIF</span> {editedData.clientNif || 'Não Inf.'}</div></div><div className="mb-3"><span className="font-bold text-gray-500 uppercase text-xs block">Local do Serviço</span> {editedData.clientAddress}</div><div><span className="font-bold text-gray-500 uppercase text-xs block mb-1">Serviço Executado</span><div className="leading-relaxed font-medium">{editedData.serviceDescription}</div></div></div></div>
                    <div className="pdf-section"><h3 className="text-base font-bold text-white bg-gray-800 px-3 py-1 uppercase mb-4 inline-block tracking-wide">2. Vigência da Garantia</h3><div className="flex items-stretch bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg overflow-hidden shadow-sm"><div className="bg-blue-600 text-white w-24 flex items-center justify-center flex-shrink-0"><ShieldCheckIcon className="h-12 w-12" /></div><div className="p-6 flex-grow"><p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Garantia válida pelo período de</p><div className="my-2 font-bold text-lg text-gray-900 uppercase">{editedData.warrantyPeriod}</div><div className="flex items-center mt-3 pt-3 border-t border-blue-100"><span className="text-sm text-gray-500 font-medium mr-2">Data de Início:</span><span className="text-base font-bold text-gray-800 bg-white px-3 py-0.5 rounded border border-gray-200">{editedData.startDate}</span></div></div></div></div>
                    <div className="pdf-section"><h3 className="text-base font-bold text-white bg-gray-800 px-3 py-1 uppercase mb-4 inline-block tracking-wide">3. Condições Gerais</h3><div className="pl-2"><ul className="space-y-3 text-sm text-justify text-gray-700">{editedData.terms.map((term, index) => (<li key={index} className="flex items-start"><span className="text-primary mr-2 font-bold">•</span><div className="w-full whitespace-pre-wrap leading-relaxed">{term}</div></li>))}</ul></div></div>
                    <div className="pdf-section"><h3 className="text-base font-bold text-white bg-gray-800 px-3 py-1 uppercase mb-4 inline-block tracking-wide">4. Exclusões de Cobertura</h3><div className="bg-red-50 p-5 border-l-4 border-red-300 rounded-r-sm"><p className="text-xs font-bold text-red-400 uppercase mb-2">A garantia não cobre:</p><div className="text-sm text-gray-800 whitespace-pre-wrap text-justify leading-relaxed font-medium">{editedData.exclusions}</div></div></div>
                </div>
                <div className="pdf-section mt-16 flex flex-col items-center text-center"><div className="border-4 border-gray-800 p-4 rounded bg-white shadow-lg min-w-[280px]"><p className="text-gray-800 font-black text-sm uppercase tracking-widest">{userSettings.companyName}</p><div className="border-t border-b border-gray-800 my-2 py-1"><p className="text-gray-800 text-[10px] uppercase font-bold tracking-wide">Departamento Técnico & Qualidade</p></div><p className="text-gray-600 text-[10px] font-mono">NIF: {userSettings.companyTaxId}</p><p className="text-red-600 font-black text-xs mt-2 tracking-widest">GARANTIA CERTIFICADA</p></div><div className="mt-10 border-t border-gray-200 pt-4 w-full"><p className="text-[10px] text-gray-400 uppercase tracking-widest">Emitido em {new Date().toLocaleDateString()}. Válido para fins legais e comerciais.</p></div></div>
            </div>
        </div>
      </div>
    </div>
  );
};
