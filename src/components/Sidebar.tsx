import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  ShoppingCart, 
  Wallet, 
  Settings, 
  Code, 
  LogOut, 
  X, 
  ShieldCheck, 
  Smartphone,
  PackagePlus 
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  storeName: string;
  storeLogo: string;
  setShowGasGuide: (show: boolean) => void;
  lang: string;
  t: (key: string) => string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
  currentUser,
  setCurrentUser,
  storeName,
  storeLogo,
  setShowGasGuide,
  lang,
  t,
}) => {
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'inventory', label: t('inventory'), icon: Package },
    { id: 'repairs', label: t('repairs'), icon: Wrench },
    { id: 'sales', label: t('sales'), icon: ShoppingCart },
    { id: 'purchases', label: t('purchases'), icon: PackagePlus },
    { id: 'expenses', label: t('expenses'), icon: Wallet },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <React.Fragment>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-[#1a237e] text-white flex flex-col border-r border-[#283593] shrink-0 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-[#3949ab] bg-[#1a237e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-black text-lg shadow-md">
              {storeLogo || 'TS'}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-tight leading-tight text-base truncate max-w-[130px]">
                {storeName || 'KSM'}
              </span>
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-0.5">
                INVENTORY & POS
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden p-2 text-indigo-200 hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-150 font-medium text-xs tracking-wider ${
                    isActive 
                      ? 'bg-[#3949ab] text-white font-bold shadow-sm' 
                      : 'text-indigo-100 hover:bg-[#283593] hover:text-white'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 transition-all ${isActive ? 'bg-white scale-110' : 'border border-indigo-300'}`} />
                  <IconComp size={16} className="shrink-0 opacity-90" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* GAS Integration Guide Button - Admin only */}
          {currentUser?.role === 'Admin' && <div className="mt-8 pt-4 border-t border-[#3949ab] px-1">
            <button
              onClick={() => {
                setShowGasGuide(true);
                setIsSidebarOpen(false);
              }}
              className="w-full p-3 bg-[#283593]/80 hover:bg-[#283593] border border-[#3949ab] rounded-md transition-all text-left group"
            >
              <div className="flex items-center gap-2 text-indigo-200 font-bold text-xs uppercase tracking-wider mb-1">
                <Code size={16} />
                <span>GAS Web App Guide</span>
              </div>
              <p className="text-[10px] text-indigo-200/80 leading-relaxed font-sans">
                {lang === 'mm' ? 'Google Apps Script + Sheets ဖြင့် တိုက်ရိုက်ချိတ်ဆက်သုံးစွဲရန်' : 'Setup guide to deploy script to Google Sheets'}
              </p>
            </button>
          </div>}
        </div>

        {/* User Info & Logout */}
        <div className="p-4 bg-[#0d47a1] border-t border-[#3949ab]">
          {currentUser && (
            <div 
              onClick={() => {
                if (window.confirm(lang === 'mm' ? 'စနစ်မှ အမှန်တကယ် ထွက်လိုပါသလား။' : 'Log out from the system?')) {
                  setCurrentUser(null);
                }
              }}
              className="flex items-center gap-3 p-2.5 rounded-md bg-[#1a237e]/70 hover:bg-[#1a237e] transition-all cursor-pointer group border border-[#3949ab]/50"
              title={t('logout')}
            >
              <div className="w-8 h-8 rounded bg-indigo-400 text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-indigo-200 opacity-80 truncate flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${currentUser.role === 'Admin' ? 'bg-emerald-400' : 'bg-indigo-300'}`}></span>
                  {currentUser.role} • GAS Integrated
                </div>
              </div>
              <LogOut size={15} className="text-indigo-200 group-hover:text-red-400 transition-colors shrink-0" />
            </div>
          )}
        </div>
      </aside>
    </React.Fragment>
  );
};
