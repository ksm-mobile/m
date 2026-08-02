import React, { useState } from 'react';
import { 
  Lock, 
  UserCheck, 
  Delete, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import { User } from '../types';
import { callRpc } from '../api';

interface LoginModalProps {
  setCurrentUser: (u: User | null) => void;
  storeName: string;
  storeTagline: string;
  storeLogo: string;
  lang: string;
  setLang: (l: string) => void;
  t: (key: string) => string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  setCurrentUser,
  storeName,
  storeTagline,
  storeLogo,
  lang,
  setLang,
  t,
}) => {
  const [authPIN, setAuthPIN] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualLogin, setManualLogin] = useState(true);

  const handleKeyPress = (num: number) => {
    if (authPIN.length < 4) {
      const newPIN = authPIN + num;
      setAuthPIN(newPIN);
      if (newPIN.length === 4) {
        const loginEmailOrName = manualEmail.trim() || 'admin@ksm.local';
        setIsAuthenticating(true);
        setAuthError('');

        callRpc('verifyStaffPIN', { email: loginEmailOrName, pin: newPIN })
          .then((res) => {
            setIsAuthenticating(false);
            if (res && res.status === 'success') {
              setCurrentUser(res.user);
              setAuthPIN('');
            } else {
              setAuthError(res && res.message ? res.message : t('invalidPin'));
              setAuthPIN('');
            }
          })
          .catch((err) => {
            setIsAuthenticating(false);
            setAuthError(err.toString());
            setAuthPIN('');
          });
      }
    }
  };

  const handleBackspace = () => {
    if (!isAuthenticating) {
      setAuthPIN(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans p-4 relative overflow-hidden select-none">
      {/* Ambient background blur circles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm bg-slate-900/60 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center z-10 border border-slate-800 backdrop-blur-md">
        {/* Brand Logo */}
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 mb-3">
          {storeLogo || 'TS'}
        </div>
        <h2 className="text-lg font-black tracking-tight text-white uppercase">{storeName || 'KSM POS'}</h2>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-6">{storeTagline || 'POS & SERVICES STUDIO'}</p>

        {/* Username / Email Field */}
        <div className="w-full mb-4">
          <input 
            type="text"
            placeholder={lang === 'mm' ? 'အမည် သို့မဟုတ် Email (e.g. Admin / Staff)' : 'Username or Email (e.g. Admin)'}
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 outline-none focus:border-blue-500 font-bold text-center text-xs tracking-wide placeholder-slate-600 transition-all font-sans"
            disabled={isAuthenticating}
          />
        </div>

        {/* PIN Indicator Dots */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div 
              key={idx} 
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                idx < authPIN.length 
                  ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50' 
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Error Display */}
        {authError && (
          <div className="mb-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-[10px] font-bold text-red-400 max-w-xs leading-relaxed animate-pulse">
            {authError}
          </div>
        )}

        {/* Numerical Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={isAuthenticating}
              onClick={() => handleKeyPress(num)}
              className="w-14 h-14 rounded-2xl bg-slate-800/80 text-white font-black text-lg hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center border border-slate-750 cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={isAuthenticating}
            onClick={() => setAuthPIN('')}
            className="w-14 h-14 rounded-2xl text-slate-500 hover:text-slate-300 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center active:scale-95 transition-all text-center cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={isAuthenticating}
            onClick={() => handleKeyPress(0)}
            className="w-14 h-14 rounded-2xl bg-slate-800/80 text-white font-black text-lg hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center border border-slate-750 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            disabled={isAuthenticating}
            onClick={handleBackspace}
            className="w-14 h-14 rounded-2xl text-slate-500 hover:text-slate-300 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
          >
            <Delete size={18} />
          </button>
        </div>

        <div className="text-[9px] font-bold text-slate-500 text-center uppercase tracking-wide italic leading-relaxed pt-2">
          {lang === 'mm' ? 'Default Admin PIN: 1234 • Staff PIN: 5555' : 'Default Admin PIN: 1234 • Staff PIN: 5555'}
        </div>
      </div>

      {/* Language Switcher */}
      <div className="absolute bottom-6 flex items-center gap-4 z-10 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
        <button 
          onClick={() => setLang('en')} 
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${lang === 'en' ? 'bg-blue-600 text-white font-black shadow-md' : 'hover:text-white'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLang('mm')} 
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${lang === 'mm' ? 'bg-blue-600 text-white font-black shadow-md' : 'hover:text-white'}`}
        >
          MM
        </button>
      </div>
    </div>
  );
};
