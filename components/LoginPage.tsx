
import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, UserCircleIcon, CheckCircleIcon } from './AppIcons';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

/**
 * CREDENCIAIS CADASTRADAS (Ofuscadas em Base64):
 * 1. comercialhidroclean@gmail.com / HidroClean2020.
 * 2. kellyaureliano@gmail.com / 654321
 */
const VALID_USERS = [
  { u: "Y29tZXJjaWFsaGlkcm9jbGVhbkBnbWFpbC5jb20=", p: "SGlkcm9DbGVhbjIwMjAu" }, 
  { u: "a2VsbHlhdXJlbGlhbm9AZ21haWwuY29t", p: "NjU0MzIx" } 
];

const b64Decode = (str: string) => {
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        return atob(str);
    }
};

const b64Encode = (str: string) => {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        return btoa(str);
    }
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [keepConnected, setKeepConnected] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('_iao_rem_u');
    if (savedEmail) {
      try {
          setEmail(b64Decode(savedEmail));
          setRememberMe(true);
      } catch (e) {
          localStorage.removeItem('_iao_rem_u');
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Pequeno delay para simular processamento e melhorar UX
    setTimeout(() => {
      const inputEmail = email.toLowerCase().trim();
      const inputPass = password.trim();

      const userFound = VALID_USERS.find(user => 
        b64Decode(user.u) === inputEmail && 
        b64Decode(user.p) === inputPass
      );

      if (userFound) {
        if (rememberMe) {
          localStorage.setItem('_iao_rem_u', b64Encode(inputEmail));
        } else {
          localStorage.removeItem('_iao_rem_u');
        }

        if (keepConnected) {
          localStorage.setItem('_iao_session_active', 'true');
        }
        
        onLoginSuccess();
      } else {
        setError('E-mail ou senha incorretos. Verifique os dados e tente novamente.');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-primary p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl shadow-lg mb-4">
               <img src="https://github.com/MateusParma/nexgenimages/blob/main/hidroclean%20logo.png?raw=true" className="h-12 w-auto" alt="Logo" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Acesso Restrito</h2>
            <p className="text-blue-100 text-xs mt-1 font-bold tracking-widest uppercase">HidroClean IA</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">E-mail Corporativo</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition text-gray-800"
                  placeholder="exemplo@hidroclean.com"
                  required
                />
                <UserCircleIcon className="absolute left-4 top-4 h-6 w-6 text-gray-300" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Palavra-passe</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition text-gray-800 font-mono"
                  placeholder="••••••••"
                  required
                />
                <ShieldCheckIcon className="absolute left-4 top-4 h-6 w-6 text-gray-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 px-1">
               <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-primary peer-checked:border-primary transition"></div>
                    <CheckCircleIcon className="absolute w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition" />
                  </div>
                  <span className="ml-2 text-[11px] font-bold text-gray-500 group-hover:text-primary transition uppercase tracking-tighter">Lembrar</span>
               </label>

               <label className="flex items-center cursor-pointer group justify-end">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={keepConnected}
                      onChange={(e) => setKeepConnected(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-primary peer-checked:border-primary transition"></div>
                    <CheckCircleIcon className="absolute w-5 h-5 text-white opacity-0 peer-checked:opacity-100 transition" />
                  </div>
                  <span className="ml-2 text-[11px] font-bold text-gray-500 group-hover:text-primary transition uppercase tracking-tighter">Manter Sessão</span>
               </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-primary text-white rounded-2xl shadow-xl text-sm font-black uppercase tracking-widest hover:bg-secondary transition transform active:scale-[0.98] disabled:opacity-70 flex justify-center items-center"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Autenticar'}
            </button>
          </form>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em]">IAO Profissional • v2.1</p>
        </div>
      </div>
    </div>
  );
};
