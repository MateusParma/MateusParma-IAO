
import React, { useRef, useState, useEffect } from 'react';
import type { WarrantyData, UserSettings } from '../types';
import { ShieldCheckIcon, DownloadIcon, CheckCircleIcon, TrashIcon, PlusIcon } from './AppIcons';

// Make jspdf and html2canvas available in the scope
declare const jspdf: any;
declare const html2canvas: any;

interface WarrantyResultProps {
  data: WarrantyData;
  userSettings: UserSettings;
  onReset: () => void;
  onAutoSave?: (data: WarrantyData) => void;
}

const EditableInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  isPrinting: boolean;
  className?: string;
  label?: string;
}> = ({ value, onChange, isPrinting, className = "", label }) => {
  if (isPrinting) return <span className={className}>{value || "-"}</span>;
  return (
    <div className="flex flex-col w-full">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase mb-1">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-blue-50/50 border-b border-transparent hover:border-primary focus:border-primary focus:bg-white outline-none transition-all p-1 ${className}`}
      />
    </div>
  );
};

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
                    scale: 2,
                    useCORS: true, 
                    windowWidth: 794,
                    backgroundColor: '#ffffff'
                };

                for (const section of sections) {
                    const canvas = await html2canvas(section, canvasOptions);
                    const imgData = canvas.toDataURL('image/jpeg', 0.85);
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

  const updateTerm = (index: number, value: string) => {
    const newTerms = [...editedData.terms];
    newTerms[index] = value;
    setEditedData({ ...editedData, terms: newTerms });
  };

  const removeTerm = (index: number) => {
    setEditedData({ ...editedData, terms: editedData.terms.filter((_, i) => i !== index) });
  };

  const addTerm = () => {
    setEditedData({ ...editedData, terms: [...editedData.terms, "Novo termo de garantia..."] });
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="sticky top-0 z-50 bg-gray-100/90 backdrop-blur-sm p-4 mb-6 flex justify-between items-center shadow-sm border-b border-gray-200">
         <div className="flex items-center gap-4">
             <button onClick={onReset} className="text-gray-600 hover:text-primary font-bold flex items-center gap-1">
                <span className="text-xl">←</span> Voltar
             </button>
             <div className="h-4 w-px bg-gray-300 mx-2"></div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {saveStatus === 'saving' ? 'A Gravar Alterações...' : 'Documento Sincronizado'}
             </span>
         </div>
         <button onClick={handlePrint} className="bg-primary text-white px-6 py-2 rounded-lg shadow-lg hover:bg-secondary flex items-center font-bold transition-all transform active:scale-95">
            <DownloadIcon className="h-5 w-5 mr-2" /> Baixar PDF
         </button>
      </div>
      
      <div className="flex justify-center">
        <div ref={pdfRef} className={`bg-white w-full max-w-4xl ${isPrinting ? 'p-0 shadow-none' : 'p-10 shadow-2xl rounded-xl border border-gray-200'}`} style={{ minHeight: '297mm', boxSizing: 'border-box' }}>
            <div className="w-full h-full flex flex-col">
                {/* Header Section */}
                <div className="pdf-section flex justify-between items-end border-b-4 border-gray-900 pb-6 mb-10">
                    <div className="flex items-center gap-6">
                        {userSettings.companyLogo ? ( 
                            <img src={userSettings.companyLogo} alt="Logo" className="h-24 object-contain" /> 
                        ) : ( 
                            <div className="h-24 w-32 bg-gray-100 flex items-center justify-center text-gray-400 font-bold border border-gray-300">LOGO</div> 
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{userSettings.companyName}</h1>
                            <div className="text-sm text-gray-600 mt-2 leading-tight">
                                <p>{userSettings.companyAddress}</p>
                                <p className="font-medium">NIF: {userSettings.companyTaxId}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-gray-900 text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Documento Oficial</div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">Termo de<br/>Garantia</h2>
                        <div className="mt-2 text-sm font-mono font-bold text-gray-500">
                            REF: <EditableInput isPrinting={isPrinting} value={editedData.code || ''} onChange={(v) => setEditedData({...editedData, code: v})} className="inline-block w-24 text-right" />
                        </div>
                    </div>
                </div>

                <div className="space-y-8 font-serif text-gray-900 flex-grow">
                    {/* Identification Section */}
                    <div className="pdf-section">
                        <h3 className="text-base font-bold text-white bg-gray-800 px-3 py-1 uppercase mb-4 inline-block tracking-wide">1. Identificação e Objeto</h3>
                        <div className="bg-gray-50 p-5 border-l-4 border-gray-400 text-sm text-gray-800 space-y-4">
                            <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-3">
                                <div className="col-span-2">
                                    <EditableInput isPrinting={isPrinting} label="Cliente" value={editedData.clientName} onChange={(v) => setEditedData({...editedData, clientName: v})} className="font-bold text-lg" />
                                </div>
                                <div>
                                    <EditableInput isPrinting={isPrinting} label="NIF" value={editedData.clientNif || ''} onChange={(v) => setEditedData({...editedData, clientNif: v})} />
                                </div>
                            </div>
                            <div>
                                <EditableInput isPrinting={isPrinting} label="Local do Serviço" value={editedData.clientAddress} onChange={(v) => setEditedData({...editedData, clientAddress: v})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Serviço Executado</label>
                                {isPrinting ? (
                                    <div className="leading-relaxed font-medium">{editedData.serviceDescription}</div>
                                ) : (
                                    <textarea 
                                        value={editedData.serviceDescription}
                                        onChange={(e) => setEditedData({...editedData, serviceDescription: e.target.value})}
                                        className="w-full bg-blue-50/50 border border-transparent hover:border-primary focus:border-primary focus:bg-white p-2 rounded outline-none text-sm transition-all"
                                        rows={3}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Validity Section */}
                    <div className="pdf-section">
                        <h3 className="text-base font-bold text-white bg-gray-800 px-3 py-1 uppercase mb-4 inline-block tracking-wide">2. Vigência da Garantia</h3>
                        <div className="flex items-stretch bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-blue-600 text-white w-24 flex items-center justify-center flex-shrink-0">
                                <ShieldCheckIcon className="h-12 w-12" />
                            </div>
                            <div className="p-6 flex-grow grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Período de Validade</p>
                                    <EditableInput isPrinting={isPrinting} value={editedData.warrantyPeriod} onChange={(v) => setEditedData({...editedData, warrantyPeriod: v})} className="text-xl font-black text-gray-900 uppercase" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Data de Início</p>
                                    <EditableInput isPrinting={isPrinting} value={editedData.startDate} onChange={(v) => setEditedData({...editedData, startDate: v})} className="text-lg font-bold text-gray-700" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms Section */}
                    <div className="pdf-section">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-white bg-gray-800 px-3 py-1 uppercase inline-block tracking-wide">3. Condições Gerais</h3>
                            {!isPrinting && (
                                <button onClick={addTerm} className="text-xs font-bold text-primary hover:text-secondary flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                                    <PlusIcon className="h-3 w-3" /> Adicionar Cláusula
                                </button>
                            )}
                        </div>
                        <div className="pl-2">
                            <ul className="space-y-4 text-sm text-justify text-gray-700">
                                {editedData.terms.map((term, index) => (
                                    <li key={index} className="flex items-start group">
                                        <span className="text-primary mr-3 font-bold mt-1">•</span>
                                        <div className="w-full flex flex-col gap-1">
                                            {isPrinting ? (
                                                <div className="leading-relaxed">{term}</div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <textarea 
                                                        value={term}
                                                        onChange={(e) => updateTerm(index, e.target.value)}
                                                        className="flex-grow bg-transparent border-b border-gray-100 hover:border-primary focus:border-primary outline-none transition-all resize-none"
                                                        rows={2}
                                                    />
                                                    <button onClick={() => removeTerm(index)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Exclusions Section */}
                    <div className="pdf-section">
                        <h3 className="text-base font-bold text-white bg-gray-800 px-3 py-1 uppercase mb-4 inline-block tracking-wide">4. Exclusões de Cobertura</h3>
                        <div className="bg-red-50 p-5 border-l-4 border-red-300 rounded-r-sm">
                            <p className="text-[10px] font-black text-red-400 uppercase mb-2 tracking-widest">A garantia não cobre:</p>
                            {isPrinting ? (
                                <div className="text-sm text-gray-800 text-justify leading-relaxed font-medium">{editedData.exclusions}</div>
                            ) : (
                                <textarea 
                                    value={editedData.exclusions}
                                    onChange={(e) => setEditedData({...editedData, exclusions: e.target.value})}
                                    className="w-full bg-white/50 border border-transparent hover:border-red-300 focus:border-red-400 p-2 rounded outline-none text-sm transition-all italic"
                                    rows={3}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Validation Section */}
                <div className="pdf-section mt-16 flex flex-col items-center text-center">
                    <div className="border-4 border-gray-800 p-4 rounded bg-white shadow-lg min-w-[280px] transform -rotate-1">
                        <p className="text-gray-800 font-black text-sm uppercase tracking-widest">{userSettings.companyName}</p>
                        <div className="border-t border-b border-gray-800 my-2 py-1">
                            <p className="text-gray-800 text-[10px] uppercase font-bold tracking-wide">Departamento Técnico & Qualidade</p>
                        </div>
                        <p className="text-gray-600 text-[10px] font-mono">NIF: {userSettings.companyTaxId}</p>
                        <p className="text-red-600 font-black text-xs mt-2 tracking-widest border-t border-gray-100 pt-1">GARANTIA CERTIFICADA</p>
                    </div>
                    <div className="mt-10 border-t border-gray-200 pt-4 w-full">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
                            Emitido em {new Date().toLocaleDateString()} via IAO Platform. Documento eletrónico válido para fins contratuais.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
