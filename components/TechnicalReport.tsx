
import React from 'react';
import type { TechnicalReportData, UserSettings, ReportSection, PhotoAnalysis } from '../types';

interface TechnicalReportProps {
  data: TechnicalReportData;
  onUpdate: (data: TechnicalReportData) => void;
  userSettings: UserSettings;
  images: string[];
  isPrinting: boolean;
}

// Helper components for consistent styling
const EditableInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  isPrinting: boolean;
  className?: string;
  label?: string;
}> = ({ value, onChange, isPrinting, className = "", label }) => {
  if (isPrinting) {
    return (
      <div className={className}>
        {label && <span className="font-bold text-gray-600 mr-1">{label}:</span>}
        {value}
      </div>
    );
  }
  return (
    <div className={`flex flex-col ${className}`}>
        {label && <label className="text-xs text-gray-500 font-bold mb-0.5">{label}</label>}
        <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-gray-300 focus:border-primary focus:outline-none py-1 bg-transparent text-gray-800 placeholder-gray-400"
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
    return <p className={`whitespace-pre-line ${className}`}>{value}</p>;
  }
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border border-gray-300 rounded p-2 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none bg-white text-gray-800 ${className}`}
      rows={minRows}
    />
  );
};

export const TechnicalReport: React.FC<TechnicalReportProps> = ({ data, onUpdate, userSettings, images, isPrinting }) => {
  const companyName = userSettings.companyName || "HidroClean";

  // Helper functions to update specific parts of the state
  const updateClientInfo = (field: keyof typeof data.clientInfo, value: string) => {
    onUpdate({
      ...data,
      clientInfo: { ...data.clientInfo, [field]: value }
    });
  };

  const updateConclusion = (field: keyof typeof data.conclusion, value: any) => {
    onUpdate({
      ...data,
      conclusion: { ...data.conclusion, [field]: value }
    });
  };

  const updateRecommendations = (field: keyof typeof data.recommendations, value: any) => {
    onUpdate({
      ...data,
      recommendations: { ...data.recommendations, [field]: value }
    });
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
    // Convert comma string back to array for storage/logic if needed, 
    // but for simple editing text is easier.
    // Here we assume the UI treats it as a text block or we split by comma.
    // For simplicity, let's change the UI to a textarea for materials list.
    onUpdate({ 
        ...data, 
        recommendations: { 
            ...data.recommendations, 
            materials: value.split(',').map(s => s.trim()) 
        } 
    });
  };

  return (
    <div className={`bg-white p-8 max-w-4xl mx-auto text-gray-800 font-sans leading-relaxed ${!isPrinting ? 'shadow-lg rounded-lg mb-8' : ''}`} id="report-content">
      {/* Header */}
      <div className="pdf-section border-b-4 border-primary pb-6 mb-8 flex justify-between items-start">
        <div className="flex flex-col items-start">
             {userSettings.companyLogo ? (
              <img src={userSettings.companyLogo} alt="Logo" className="h-24 w-auto object-contain mb-3" />
            ) : (
              <div className="h-20 w-20 bg-gray-200 flex items-center justify-center text-gray-500 text-xs mb-3 rounded">Sem Logo</div>
            )}
            <h1 className="text-3xl font-bold text-primary uppercase tracking-wider leading-none">{companyName}</h1>
            <p className="text-xs text-gray-500 mt-1">Serviços de Engenharia e Diagnóstico Técnico</p>
        </div>
        <div className="text-right">
            <h2 className="text-xl font-bold text-gray-700">LAUDO TÉCNICO</h2>
            <p className="text-sm text-gray-500">Relatório de Inspeção</p>
            <EditableInput 
                isPrinting={isPrinting} 
                value={data.clientInfo.date} 
                onChange={(v) => updateClientInfo('date', v)} 
                className="text-sm font-mono mt-2 text-gray-600 justify-end" 
            />
        </div>
      </div>

      {/* 1. Identification */}
      <div className="pdf-section mb-8">
        <h3 className="text-lg font-bold text-primary bg-blue-50 p-2 border-l-4 border-primary mb-4">1. IDENTIFICAÇÃO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <EditableInput isPrinting={isPrinting} label="Cliente" value={data.clientInfo.name} onChange={(v) => updateClientInfo('name', v)} />
            <EditableInput isPrinting={isPrinting} label="Data da Inspeção" value={data.clientInfo.date} onChange={(v) => updateClientInfo('date', v)} />
            <EditableInput isPrinting={isPrinting} label="Morada/Local" value={data.clientInfo.address} onChange={(v) => updateClientInfo('address', v)} className="sm:col-span-2" />
            <EditableInput isPrinting={isPrinting} label="Tipo de Edifício" value={data.clientInfo.buildingType} onChange={(v) => updateClientInfo('buildingType', v)} />
            <EditableInput isPrinting={isPrinting} label="Técnico Responsável" value={data.clientInfo.technician || ''} onChange={(v) => updateClientInfo('technician', v)} />
        </div>
      </div>

      {/* 2. Objective */}
      <div className="pdf-section mb-8">
        <h3 className="text-lg font-bold text-primary bg-blue-50 p-2 border-l-4 border-primary mb-4">2. OBJETIVO DA INTERVENÇÃO</h3>
        <EditableTextArea 
            isPrinting={isPrinting} 
            value={data.objective} 
            onChange={(v) => onUpdate({...data, objective: v})} 
            className="text-justify text-gray-700 text-sm"
        />
      </div>

      {/* 3. Methodology */}
      <div className="pdf-section mb-8">
        <h3 className="text-lg font-bold text-primary bg-blue-50 p-2 border-l-4 border-primary mb-4">3. METODOLOGIA E EQUIPAMENTOS</h3>
        <p className="mb-2 text-sm text-gray-600">Foram utilizados os seguintes métodos não destrutivos e equipamentos de precisão:</p>
        <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-medium text-gray-700">
            {data.methodology.map((item, idx) => (
                <li key={idx} className="flex items-center">
                    {!isPrinting && <span className="mr-2 text-gray-400">•</span>}
                    <EditableInput 
                        isPrinting={isPrinting} 
                        value={item} 
                        onChange={(v) => updateMethodology(idx, v)}
                        className="w-full" 
                    />
                </li>
            ))}
        </ul>
      </div>

      {/* 4. Development */}
      <div className="pdf-section mb-8">
        <h3 className="text-lg font-bold text-primary bg-blue-50 p-2 border-l-4 border-primary mb-6">4. DESENVOLVIMENTO DA INVESTIGAÇÃO</h3>
        <div className="space-y-6">
            {data.development.map((section, idx) => (
                <div key={idx}>
                     <div className="flex items-center mb-2 border-b border-gray-200 pb-1">
                        <span className="text-md font-bold text-gray-800 uppercase tracking-wide mr-2">4.{idx + 1}</span>
                        <EditableInput 
                            isPrinting={isPrinting} 
                            value={section.title} 
                            onChange={(v) => updateDevelopment(idx, 'title', v)} 
                            className="text-md font-bold text-gray-800 uppercase tracking-wide w-full"
                        />
                     </div>
                    <EditableTextArea
                        isPrinting={isPrinting}
                        value={section.content}
                        onChange={(v) => updateDevelopment(idx, 'content', v)}
                        className="text-justify text-sm text-gray-700"
                        minRows={5}
                    />
                </div>
            ))}
        </div>
      </div>

      {/* 5. Photo Analysis */}
      {data.photoAnalysis && data.photoAnalysis.length > 0 && (
          <div className="pdf-section mb-8 break-before-page">
            <h3 className="text-lg font-bold text-primary bg-blue-50 p-2 border-l-4 border-primary mb-4">5. ANÁLISE FOTOGRÁFICA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {data.photoAnalysis.map((photo, idx) => {
                    const imgSrc = images[photo.photoIndex];
                    if (!imgSrc) return null;
                    return (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm" style={{ breakInside: 'avoid' }}>
                            <div className="h-48 overflow-hidden bg-gray-100 relative">
                                <img src={imgSrc} alt={photo.legend} className="w-full h-full object-cover" />
                                <span className="absolute top-0 left-0 bg-primary text-white text-xs font-bold px-2 py-1">Foto {idx + 1}</span>
                            </div>
                            <div className="p-3 bg-gray-50 space-y-2">
                                <EditableInput 
                                    isPrinting={isPrinting} 
                                    value={photo.legend} 
                                    onChange={(v) => updatePhotoAnalysis(idx, 'legend', v)} 
                                    className="font-bold text-xs text-gray-800"
                                    label={isPrinting ? undefined : "Legenda"}
                                />
                                <EditableTextArea
                                    isPrinting={isPrinting}
                                    value={photo.description}
                                    onChange={(v) => updatePhotoAnalysis(idx, 'description', v)}
                                    className="text-xs text-gray-600"
                                    minRows={2}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
          </div>
      )}

      {/* 6. Conclusion */}
      <div className="pdf-section mb-8 border-t-2 border-gray-300 pt-6">
        <h3 className="text-lg font-bold text-primary bg-blue-50 p-2 border-l-4 border-primary mb-4">6. CONCLUSÃO TÉCNICA</h3>
        <div className="space-y-4 text-sm text-gray-700">
            <div>
                <span className="font-bold text-gray-900 block mb-1">Diagnóstico Final:</span>
                <EditableTextArea isPrinting={isPrinting} value={data.conclusion.diagnosis} onChange={(v) => updateConclusion('diagnosis', v)} />
            </div>
            <div>
                 <span className="font-bold text-gray-900 block mb-1">Prova Técnica:</span>
                 <EditableTextArea isPrinting={isPrinting} value={data.conclusion.technicalProof} onChange={(v) => updateConclusion('technicalProof', v)} />
            </div>
            <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">Estado da Fuga:</span>
                {isPrinting ? (
                     data.conclusion.activeLeak ? <span className="text-red-600 font-bold">ATIVA</span> : <span className="text-green-600 font-bold">NÃO ATIVA / INTERMITENTE</span>
                ) : (
                    <div className="flex items-center gap-4">
                        <label className="flex items-center">
                            <input type="radio" name="activeLeak" checked={data.conclusion.activeLeak} onChange={() => updateConclusion('activeLeak', true)} className="mr-1" />
                            Ativa
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="activeLeak" checked={!data.conclusion.activeLeak} onChange={() => updateConclusion('activeLeak', false)} className="mr-1" />
                            Não Ativa
                        </label>
                    </div>
                )}
            </div>
            <div className={`p-2 border rounded ${isPrinting ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                <span className="font-bold text-gray-900 block mb-1">Consequências/Risco:</span>
                 <EditableTextArea isPrinting={isPrinting} value={data.conclusion.consequences} onChange={(v) => updateConclusion('consequences', v)} />
            </div>
        </div>
      </div>

      {/* 7. Recommendations */}
      <div className="pdf-section mb-12">
        <h3 className="text-lg font-bold text-primary bg-blue-50 p-2 border-l-4 border-primary mb-4">7. RECOMENDAÇÕES DE REPARO</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm space-y-3">
             <div>
                 <span className="font-bold block mb-1">Ação Recomendada:</span>
                 <EditableTextArea isPrinting={isPrinting} value={data.recommendations.repairType} onChange={(v) => updateRecommendations('repairType', v)} />
             </div>
             <div>
                 <span className="font-bold block mb-1">Materiais Sugeridos:</span>
                 <EditableTextArea 
                    isPrinting={isPrinting} 
                    value={data.recommendations.materials.join(', ')} 
                    onChange={(v) => updateMaterials(v)} 
                    className=""
                />
             </div>
             <div>
                 <span className="font-bold block mb-1">Tempo Estimado:</span>
                 <EditableInput isPrinting={isPrinting} value={data.recommendations.estimatedTime} onChange={(v) => updateRecommendations('estimatedTime', v)} />
             </div>
             {data.recommendations.notes && (
                 <div>
                    <span className="font-bold block mb-1">Notas:</span>
                    <EditableTextArea isPrinting={isPrinting} value={data.recommendations.notes} onChange={(v) => updateRecommendations('notes', v)} />
                 </div>
             )}
        </div>
      </div>

      {/* Disclaimer / Footer */}
      <div className="pdf-section mt-12 text-xs text-gray-500 border-t border-gray-300 pt-4 text-center">
        <p className="mb-1">Este relatório reflete as condições observadas no momento da inspeção técnica.</p>
        <p className="mb-1">A {companyName} não se responsabiliza por obras executadas por terceiros.</p>
        <div className="mt-4 font-bold text-lg">{companyName}</div>
        <div className="text-gray-600">Soluções em Hidráulica e Construção</div>
        {userSettings.companyAddress && <p className="mt-1">{userSettings.companyAddress}</p>}
        {userSettings.companyTaxId && <p>NIF: {userSettings.companyTaxId}</p>}
      </div>
    </div>
  );
};
