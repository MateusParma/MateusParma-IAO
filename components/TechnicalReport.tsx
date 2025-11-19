
import React, { useRef, useState } from 'react';
import type { TechnicalReportData, UserSettings, ReportSection, PhotoAnalysis } from '../types';
import { CameraIcon, TrashIcon, GearsIcon } from './AppIcons';

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

// Helper components for consistent styling
const EditableInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  isPrinting: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  alignment?: 'left' | 'right' | 'center';
}> = ({ value, onChange, isPrinting, className = "", label, placeholder = "-", alignment = 'left' }) => {
  if (isPrinting) {
    return (
      <div className={`${className} text-${alignment}`} style={{ color: '#000000' }}>
        {label && <span className="font-bold mr-2" style={{ color: '#000000' }}>{label}:</span>}
        <span style={{ color: '#000000' }}>{value || "-"}</span>
      </div>
    );
  }
  return (
    <div className={`flex flex-col ${className}`}>
        {label && <label className="text-xs text-gray-500 font-bold mb-1">{label}</label>}
        <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border-b border-gray-300 focus:border-primary focus:outline-none py-1 bg-transparent text-gray-900 placeholder-gray-400 text-base text-${alignment}`}
        placeholder={placeholder}
        />
    </div>
  );
};

const EditableTextArea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  isPrinting: boolean;
  className?: string;
  minRows?: number;
}> = ({ value, onChange, isPrinting, className = "", minRows = 3 }) => {
  if (isPrinting) {
    return <p className={`whitespace-pre-line text-justify leading-loose ${className}`} style={{ color: '#000000' }}>{value}</p>;
  }
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border border-gray-300 rounded p-3 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white text-gray-900 text-base leading-relaxed ${className}`}
      rows={minRows}
    />
  );
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingDescriptions, setLoadingDescriptions] = useState<number[]>([]);

  // Helper functions
  const updateClientInfo = (field: keyof typeof data.clientInfo, value: string) => {
    onUpdate({ ...data, clientInfo: { ...data.clientInfo, [field]: value } });
  };
  const updateConclusion = (field: keyof typeof data.conclusion, value: any) => {
    onUpdate({ ...data, conclusion: { ...data.conclusion, [field]: value } });
  };
  const updateRecommendations = (field: keyof typeof data.recommendations, value: any) => {
    onUpdate({ ...data, recommendations: { ...data.recommendations, [field]: value } });
  };
  const updateDevelopment = (index: number, field: keyof ReportSection, value: string) => {
    const newDev = [...data.development];
    newDev[index] = { ...newDev[index], [field]: value };
    onUpdate({ ...data, development: newDev });
  };
  const updatePhotoAnalysis = (index: number, field: keyof PhotoAnalysis, value: string) => {
    const newPhotos = [...data.photoAnalysis];
    newPhotos[index] = { ...newPhotos[index], [field]: value };
    onUpdate({ ...data, photoAnalysis: newPhotos });
  };
  const updateMethodology = (index: number, value: string) => {
    const newMeth = [...data.methodology];
    newMeth[index] = value;
    onUpdate({ ...data, methodology: newMeth });
  };
  const updateMaterials = (value: string) => {
    onUpdate({ ...data, recommendations: { ...data.recommendations, materials: value.split(',').map(s => s.trim()) } });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      onAddImage(file);
      const newIndex = images.length;
      const newAnalysis: PhotoAnalysis = { photoIndex: newIndex, legend: "Nova Evidência", description: "" };
      onUpdate({ ...data, photoAnalysis: [...data.photoAnalysis, newAnalysis] });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handleGenerateDescription = async (photoIndex: number, arrayIndex: number) => {
    setLoadingDescriptions(prev => [...prev, arrayIndex]);
    try {
        const result = await onAutoDescribe(photoIndex);
        if (result) {
            const newPhotos = [...data.photoAnalysis];
            newPhotos[arrayIndex] = { ...newPhotos[arrayIndex], legend: result.legend, description: result.description };
            onUpdate({ ...data, photoAnalysis: newPhotos });
        }
    } finally {
        setLoadingDescriptions(prev => prev.filter(i => i !== arrayIndex));
    }
  };

  // Group photos into rows of 2 for correct PDF pagination
  const photoRows = [];
  for (let i = 0; i < data.photoAnalysis.length; i += 2) {
    photoRows.push(data.photoAnalysis.slice(i, i + 2));
  }

  return (
    <div className={`bg-white max-w-4xl mx-auto text-gray-900 font-serif leading-loose ${!isPrinting ? 'shadow-lg rounded-lg p-8 mb-8' : 'p-0'}`} id="report-content">
      
      {/* Header */}
      <div className="pdf-section flex flex-row justify-between items-start border-b-4 border-gray-900 pb-6 mb-12">
        <div className="flex items-center gap-6">
             {userSettings.companyLogo ? (
              <img src={userSettings.companyLogo} alt="Logo" className="h-28 w-auto object-contain" />
            ) : (
              <div className="h-24 w-24 bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-300">LOGO</div>
            )}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">{companyName}</h1>
                {userSettings.companySlogan && <p className="text-base font-medium text-primary mt-1">{userSettings.companySlogan}</p>}
                <div className="text-sm text-gray-600 mt-3 space-y-0.5 leading-tight">
                    <p>{userSettings.companyAddress}</p>
                    <p>NIF: {userSettings.companyTaxId}</p>
                </div>
            </div>
        </div>
        <div className="text-right flex flex-col items-end">
            {/* Ref Processo - Styled for High Contrast in PDF */}
            <div className="bg-white px-4 py-2 rounded border-2 border-gray-800 inline-block mb-3 min-w-[180px]">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1" style={isPrinting ? { color: '#000' } : {}}>Ref. Processo</p>
                <EditableInput 
                    isPrinting={isPrinting}
                    value={data.code || ''}
                    onChange={(v) => onUpdate({...data, code: v})}
                    alignment="right"
                    className="text-2xl font-mono font-bold text-gray-900"
                />
            </div>
            <p className="text-xl font-bold text-gray-800 mt-2" style={isPrinting ? { color: '#000' } : {}}>RELATÓRIO TÉCNICO</p>
            <p className="text-sm text-gray-500 uppercase font-medium tracking-wide">Peritagem de Danos por Água</p>
        </div>
      </div>

      {/* 1. Identification */}
      <div className="pdf-section mb-10">
        <h3 className="text-lg font-bold text-white bg-gray-800 px-4 py-2 uppercase mb-5 tracking-wide">1. Identificação do Risco e Sinistrado</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-lg border border-gray-200 p-6 rounded-sm bg-gray-50/50">
            <EditableInput isPrinting={isPrinting} label="Segurado / Cliente" value={data.clientInfo.name} onChange={(v) => updateClientInfo('name', v)} />
            <EditableInput isPrinting={isPrinting} label="Contato" value={data.clientInfo.contact || ''} onChange={(v) => updateClientInfo('contact', v)} />
            <EditableInput isPrinting={isPrinting} label="NIF" value={data.clientInfo.nif || ''} onChange={(v) => updateClientInfo('nif', v)} />
            <EditableInput isPrinting={isPrinting} label="Tipologia do Imóvel" value={data.clientInfo.buildingType} onChange={(v) => updateClientInfo('buildingType', v)} />
            
            <EditableInput isPrinting={isPrinting} label="Local do Risco (Morada)" value={data.clientInfo.address} onChange={(v) => updateClientInfo('address', v)} className="sm:col-span-2" />
            
            <EditableInput isPrinting={isPrinting} label="Terceiro / Interessado" value={data.clientInfo.interestedParty || ''} onChange={(v) => updateClientInfo('interestedParty', v)} className="sm:col-span-2" />
            
            <div className="sm:col-span-2 border-t border-gray-200 pt-4 mt-2 grid grid-cols-2 gap-x-10">
                <EditableInput isPrinting={isPrinting} label="Data da Vistoria" value={data.clientInfo.date} onChange={(v) => updateClientInfo('date', v)} />
                <EditableInput isPrinting={isPrinting} label="Técnico Perito" value={data.clientInfo.technician || ''} onChange={(v) => updateClientInfo('technician', v)} />
            </div>
        </div>
      </div>

      {/* 2. Objective */}
      <div className="pdf-section mb-10">
        <h3 className="text-lg font-bold text-white bg-gray-800 px-4 py-2 uppercase mb-5 tracking-wide">2. Objetivo da Perícia</h3>
        <div className="text-lg text-gray-900 px-2">
            <EditableTextArea 
                isPrinting={isPrinting} 
                value={data.objective} 
                onChange={(v) => onUpdate({...data, objective: v})} 
            />
        </div>
      </div>

      {/* 3. Methodology */}
      <div className="pdf-section mb-10">
        <h3 className="text-lg font-bold text-white bg-gray-800 px-4 py-2 uppercase mb-5 tracking-wide">3. Metodologia e Equipamentos</h3>
        <p className="mb-4 text-lg text-gray-700 px-2 italic">Para a elaboração deste laudo, foram empregados os seguintes métodos não destrutivos e equipamentos:</p>
        <ul className="grid grid-cols-2 gap-5 text-lg px-2">
            {data.methodology.map((item, idx) => (
                <li key={idx} className="flex items-center bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <span className="w-2.5 h-2.5 bg-primary rounded-full mr-3 shrink-0"></span>
                    <EditableInput 
                        isPrinting={isPrinting} 
                        value={item} 
                        onChange={(v) => updateMethodology(idx, v)}
                        className="w-full font-medium text-gray-800" 
                    />
                </li>
            ))}
        </ul>
      </div>

      {/* 4. Development */}
      <div className="pdf-section mb-10">
        <h3 className="text-lg font-bold text-white bg-gray-800 px-4 py-2 uppercase mb-6 tracking-wide">4. Desenvolvimento da Averiguação</h3>
        <div className="space-y-10 px-2">
            {data.development.map((section, idx) => (
                <div key={idx}>
                     <div className="mb-3 pb-1 border-b border-gray-200">
                        <EditableInput 
                            isPrinting={isPrinting} 
                            value={section.title} 
                            onChange={(v) => updateDevelopment(idx, 'title', v)} 
                            className="text-xl font-bold text-gray-900 w-full uppercase"
                        />
                     </div>
                    <EditableTextArea
                        isPrinting={isPrinting}
                        value={section.content}
                        onChange={(v) => updateDevelopment(idx, 'content', v)}
                        className="text-lg text-gray-800 pl-0 border-0"
                        minRows={5}
                    />
                </div>
            ))}
        </div>
      </div>

      {/* 5. Photo Analysis - SECTION BY SECTION to avoid cuts */}
      <h3 className="pdf-section text-lg font-bold text-white bg-gray-800 px-4 py-2 uppercase mb-6 break-before-page tracking-wide">5. Registo Fotográfico e Análise</h3>
      
      {!isPrinting && (
          <div className="mb-6 px-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center text-base font-medium bg-primary text-white px-5 py-3 rounded hover:bg-secondary transition shadow-sm">
                <CameraIcon className="h-5 w-5 mr-2" /> Adicionar Foto ao Relatório
            </button>
          </div>
      )}

      {photoRows.map((row, rowIndex) => (
        <div key={rowIndex} className="pdf-section grid grid-cols-2 gap-8 mb-8 px-2" style={{ breakInside: 'avoid' }}>
            {row.map((photo, colIndex) => {
                const imgSrc = images[photo.photoIndex];
                const isAnalysing = loadingDescriptions.includes(photo.photoIndex);
                
                return (
                    <div key={colIndex} className="flex flex-col h-full">
                        <div className="relative border-2 border-gray-200 bg-gray-100 h-72 w-full mb-3 flex-shrink-0">
                            {imgSrc ? (
                                <img src={imgSrc} alt={photo.legend} className="w-full h-full object-contain p-1" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">Imagem não encontrada</div>
                            )}
                            {!isPrinting && (
                                <div className="absolute top-2 right-2 z-10 flex gap-2">
                                    <button onClick={() => handleGenerateDescription(photo.photoIndex, data.photoAnalysis.indexOf(photo))} className="bg-white p-2 rounded-full shadow text-primary hover:text-secondary" title="Gerar descrição com IA" disabled={isAnalysing}>
                                        <GearsIcon className={`h-5 w-5 ${isAnalysing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button onClick={() => onRemoveImage(photo.photoIndex)} className="bg-white p-2 rounded-full shadow text-red-500 hover:text-red-700" title="Remover">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                            <span className="absolute bottom-0 left-0 bg-gray-800 text-white text-xs px-3 py-1 font-mono font-bold">
                                FOTO #{data.photoAnalysis.indexOf(photo) + 1}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-4 border-l-4 border-gray-300 flex-grow">
                            <EditableInput 
                                isPrinting={isPrinting} 
                                value={photo.legend} 
                                onChange={(v) => updatePhotoAnalysis(data.photoAnalysis.indexOf(photo), 'legend', v)} 
                                className="font-bold text-gray-900 mb-2 uppercase text-sm"
                            />
                            <EditableTextArea
                                isPrinting={isPrinting}
                                value={photo.description}
                                onChange={(v) => updatePhotoAnalysis(data.photoAnalysis.indexOf(photo), 'description', v)}
                                className="text-sm text-gray-700 leading-relaxed"
                                minRows={3}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
      ))}


      {/* 6. Conclusion */}
      <div className="pdf-section mb-10 mt-12 border-t-2 border-gray-300 pt-8">
        <h3 className="text-lg font-bold text-white bg-gray-800 px-4 py-2 uppercase mb-6 tracking-wide">6. Parecer Técnico Conclusivo</h3>
        <div className="space-y-8 px-2 text-lg">
            <div>
                <span className="font-bold text-primary uppercase text-sm tracking-wide block mb-2">Diagnóstico da Origem:</span>
                <div className="bg-blue-50 p-5 border border-blue-100 rounded-sm">
                    <EditableTextArea isPrinting={isPrinting} value={data.conclusion.diagnosis} onChange={(v) => updateConclusion('diagnosis', v)} className="font-medium text-gray-900" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                    <span className="font-bold text-gray-900 block mb-2 text-sm uppercase">Nexo Causal (Prova Técnica):</span>
                    <EditableTextArea isPrinting={isPrinting} value={data.conclusion.technicalProof} onChange={(v) => updateConclusion('technicalProof', v)} />
                </div>
                 <div>
                    <span className="font-bold text-gray-900 block mb-2 text-sm uppercase">Estado Atual da Avaria:</span>
                    {isPrinting ? (
                        data.conclusion.activeLeak ? 
                        <div className="text-red-700 font-bold border-2 border-red-200 bg-red-50 p-4 text-center rounded uppercase tracking-wide">⚠️ FUGA ATIVA / EM CURSO</div> : 
                        <div className="text-green-700 font-bold border-2 border-green-200 bg-green-50 p-4 text-center rounded uppercase tracking-wide">✅ ESTANCADA / RESOLVIDA</div>
                    ) : (
                        <div className="flex items-center gap-4 p-3 border border-gray-200 rounded bg-white">
                            <label className="flex items-center cursor-pointer"><input type="radio" name="activeLeak" checked={data.conclusion.activeLeak} onChange={() => updateConclusion('activeLeak', true)} className="mr-2" /> Ativa</label>
                            <label className="flex items-center cursor-pointer"><input type="radio" name="activeLeak" checked={!data.conclusion.activeLeak} onChange={() => updateConclusion('activeLeak', false)} className="mr-2" /> Resolvida</label>
                        </div>
                    )}
                </div>
            </div>
            <div>
                <span className="font-bold text-gray-900 block mb-2 text-sm uppercase">Danos Consequentes:</span>
                <EditableTextArea isPrinting={isPrinting} value={data.conclusion.consequences} onChange={(v) => updateConclusion('consequences', v)} />
            </div>
        </div>
      </div>

      {/* 7. Recommendations */}
      <div className="pdf-section mb-16">
        <h3 className="text-lg font-bold text-white bg-gray-800 px-4 py-2 uppercase mb-6 tracking-wide">7. Plano de Reparação e Recomendações</h3>
        <div className="border border-gray-200 p-6 rounded-sm text-lg space-y-8 bg-gray-50">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                     <span className="font-bold block mb-2 text-sm uppercase text-gray-500">Intervenção Recomendada:</span>
                     <EditableTextArea isPrinting={isPrinting} value={data.recommendations.repairType} onChange={(v) => updateRecommendations('repairType', v)} className="font-medium" />
                </div>
                <div>
                     <span className="font-bold block mb-2 text-sm uppercase text-gray-500">Tempo Estimado:</span>
                     <EditableInput isPrinting={isPrinting} value={data.recommendations.estimatedTime} onChange={(v) => updateRecommendations('estimatedTime', v)} />
                </div>
             </div>
             <div>
                 <span className="font-bold block mb-2 text-sm uppercase text-gray-500">Materiais e Recursos:</span>
                 <EditableTextArea isPrinting={isPrinting} value={data.recommendations.materials.join(', ')} onChange={(v) => updateMaterials(v)} />
             </div>
             {data.recommendations.notes && (
                 <div className="pt-4 border-t border-gray-200 mt-2">
                    <span className="font-bold block mb-2 text-sm uppercase text-gray-500">Notas / Exclusões:</span>
                    <EditableTextArea isPrinting={isPrinting} value={data.recommendations.notes} onChange={(v) => updateRecommendations('notes', v)} className="text-gray-500 italic" />
                 </div>
             )}
        </div>
      </div>

      {/* Footer */}
      <div className="pdf-section mt-20 text-sm text-gray-500 border-t-2 border-gray-900 pt-10 text-center">
        <p className="mb-2 italic">"Este relatório reflete fielmente as condições observadas no momento da peritagem técnica, fundamentado em métodos não destrutivos e análise profissional."</p>
        <div className="mt-8 font-bold text-lg text-gray-900 uppercase tracking-widest">{companyName}</div>
        <div className="text-gray-600">Departamento Técnico de Engenharia e Peritagem</div>
        <div className="mt-12 pt-2 border-t border-gray-300 w-1/2 mx-auto">
             <p className="text-xs text-gray-400 uppercase tracking-widest">Assinatura do Técnico Responsável</p>
        </div>
      </div>
    </div>
  );
};
