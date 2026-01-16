
import React, { useState, useRef } from 'react';
import { UserSettings } from '../types';
import { saveSettingsToDb } from '../services/supabaseService';
import { CheckCircleIcon, CogIcon, UserCircleIcon, CameraIcon, UploadIcon } from './AppIcons';

interface SettingsPageProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const HIDROCLEAN_LOGO = "https://github.com/MateusParma/nexgenimages/blob/main/hidroclean%20logo.png?raw=true";
const GILMAR_LOGO = "https://github.com/MateusParma/nexgenimages/blob/main/hidroclean%20logo.png?raw=true"; // Substituir por logo real se disponível

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profiles = {
    hidroclean: {
      companyName: 'HidroClean Canalizações',
      companySlogan: 'Sistemas Hidráulicos e Remodelações',
      companyAddress: 'Rua das Fontaínhas, 51 - Amadora',
      companyTaxId: '518050955',
      companyLogo: HIDROCLEAN_LOGO,
    },
    gilmar: {
      companyName: 'Gilmar Rocha - Construção',
      companySlogan: 'Manutenção e Obras Gerais',
      companyAddress: 'Av. Principal, Lisboa',
      companyTaxId: '123456789',
      companyLogo: GILMAR_LOGO,
    }
  };

  const applyProfile = (profile: keyof typeof profiles) => {
    const selected = profiles[profile];
    setFormData(selected);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    saveSettingsToDb(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8 pb-10">
      <div className="border-b border-gray-100 pb-4 flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase flex items-center gap-2">
            <CogIcon className="h-7 w-7 text-primary" />
            Ajustes da Empresa
            </h2>
            <p className="text-gray-500 text-sm">Personalize os dados que aparecem nos seus documentos.</p>
        </div>
        {showSuccess && (
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm animate-bounce">
              <CheckCircleIcon className="h-5 w-5" /> Configurações Salvas!
            </div>
        )}
      </div>

      {/* Atalhos de Perfil */}
      <div className="space-y-3">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preenchimento Rápido</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
            type="button"
            onClick={() => applyProfile('hidroclean')}
            className={`flex items-center gap-4 p-4 bg-white border-2 rounded-2xl transition text-left group ${formData.companyTaxId === '518050955' ? 'border-primary ring-2 ring-primary/10 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
            >
            <div className={`p-3 rounded-full transition ${formData.companyTaxId === '518050955' ? 'bg-primary text-white' : 'bg-blue-50 text-primary'}`}>
                <UserCircleIcon className="h-6 w-6" />
            </div>
            <div>
                <p className="font-black text-gray-900 uppercase text-xs tracking-widest">HidroClean</p>
                <p className="text-gray-500 text-xs">Perfil Principal (Padrão)</p>
            </div>
            </button>

            <button 
            type="button"
            onClick={() => applyProfile('gilmar')}
            className={`flex items-center gap-4 p-4 bg-white border-2 rounded-2xl transition text-left group ${formData.companyTaxId === '123456789' ? 'border-green-600 ring-2 ring-green-500/10 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
            >
            <div className={`p-3 rounded-full transition ${formData.companyTaxId === '123456789' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'}`}>
                <UserCircleIcon className="h-6 w-6" />
            </div>
            <div>
                <p className="font-black text-gray-900 uppercase text-xs tracking-widest">Gilmar Rocha</p>
                <p className="text-gray-500 text-xs">Perfil Secundário</p>
            </div>
            </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm space-y-8">
        {/* Seção do Logo */}
        <div className="flex flex-col md:flex-row items-center gap-8 border-b border-gray-50 pb-8">
            <div className="relative group">
                <div className="h-32 w-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl overflow-hidden flex items-center justify-center relative">
                    {formData.companyLogo ? (
                        <img src={formData.companyLogo} className="h-full w-full object-contain p-2" alt="Preview Logo" />
                    ) : (
                        <CameraIcon className="h-10 w-10 text-gray-300" />
                    )}
                </div>
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-xl shadow-lg hover:bg-secondary transition-all transform active:scale-90"
                    title="Trocar Logo"
                >
                    <UploadIcon className="h-5 w-5" />
                </button>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                />
            </div>
            <div className="flex-grow space-y-2 text-center md:text-left">
                <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg">Logótipo da Empresa</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Carregue o logótipo oficial. Recomendamos imagens em <strong>PNG transparente</strong> para melhor integração com os PDFs.
                </p>
                <div className="flex gap-2 justify-center md:justify-start">
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, companyLogo: HIDROCLEAN_LOGO})}
                        className="text-[10px] font-bold text-primary hover:underline"
                    >
                        Restaurar Padrão HidroClean
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome da Entidade</label>
            <input 
              type="text" 
              value={formData.companyName}
              onChange={e => setFormData({...formData, companyName: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none font-bold transition-all"
              placeholder="Ex: HidroClean Lda"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">NIF / Identificação Fiscal</label>
            <input 
              type="text" 
              value={formData.companyTaxId}
              onChange={e => setFormData({...formData, companyTaxId: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
              placeholder="518..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Slogan / Especialidade</label>
            <input 
              type="text" 
              value={formData.companySlogan || ''}
              onChange={e => setFormData({...formData, companySlogan: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
              placeholder="Ex: Canalizações 24h"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Morada Fiscal Completa</label>
            <input 
              type="text" 
              value={formData.companyAddress}
              onChange={e => setFormData({...formData, companyAddress: e.target.value})}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all"
              placeholder="Rua, Número, Código Postal, Localidade"
            />
          </div>
        </div>

        <div className="pt-6 flex items-center justify-end border-t border-gray-50">
          <button 
            type="submit"
            className="w-full md:w-auto px-12 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-secondary transition transform active:scale-95 flex items-center justify-center gap-3"
          >
            Salvar Alterações
            <CheckCircleIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
