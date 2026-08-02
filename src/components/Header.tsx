import React from 'react';
import { 
  Menu, 
  Search, 
  RefreshCw, 
  Sun, 
  Moon, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  Sliders 
} from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  activeView: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  isSaving: boolean;
  refreshAll: () => void;
  lang: string;
  setLang: (l: string) => void;
  theme: string;
  setTheme: (t: string) => void;
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: User | null;
  t: (key: string) => string;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  isSaving,
  refreshAll,
  lang,
  setLang,
  theme,
  setTheme,
  setIsSidebarOpen,
  currentUser,
  t,
}) => {
  return (
    <header className="min-h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-2.5 sm:px-4 lg:px-8 py-2 shrink-0 z-20 shadow-xs transition-colors">
      <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all"
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-3">
          <h1 className="hidden sm:block text-base lg:text-lg font-bold tracking-tight text-gray-800 dark:text-white uppercase mr-1 whitespace-nowrap">
            {t(activeView)}
          </h1>
          <span className="hidden sm:inline-flex px-2 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-[10px] font-bold rounded uppercase tracking-wider">
            Live Connection
          </span>
        </div>

        <div className="relative flex-1 min-w-0 max-w-xs lg:max-w-md sm:ml-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={15} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-md text-xs font-medium text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none placeholder:text-gray-400" 
            placeholder={t('searchPlaceholder')} 
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 ml-1 sm:ml-2 lg:ml-4">
        {activeView === 'repairs' && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('statusFilter')}:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-md border border-gray-200 dark:border-slate-700 outline-none cursor-pointer"
            >
              <option value="All">{t('all')}</option>
              <option value="Pending">{t('pending')}</option>
              <option value="Repairing">{t('repairing')}</option>
              <option value="Done">{t('ready')}</option>
              <option value="Reject">{t('reject')}</option>
              <option value="Delivered">{t('delivered')}</option>
            </select>
          </div>
        )}

        <button 
          onClick={refreshAll}
          disabled={isSaving}
          className="hidden sm:block p-2 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-all"
          title="Sync Data"
        >
          <RefreshCw size={17} className={isSaving ? 'animate-spin' : ''} />
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="hidden sm:block p-2 text-gray-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-all"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Language Switcher */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-md p-1 text-[10px] font-bold">
          <button 
            onClick={() => setLang('en')} 
            className={`px-2 py-1 rounded transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500 dark:text-slate-400'}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang('mm')} 
            className={`px-2 py-1 rounded transition-all ${lang === 'mm' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500 dark:text-slate-400'}`}
          >
            MM
          </button>
        </div>

        {/* Active User Badge */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-gray-200 dark:border-slate-800">
            <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${currentUser.role === 'Admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
              {currentUser.role === 'Admin' ? <ShieldCheck size={14} /> : <UserIcon size={14} />}
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[110px]">{currentUser.name}</div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{currentUser.role}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
