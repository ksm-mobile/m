import React, { useState } from 'react';
import { X, Copy, Check, Code, FileCode, Layers } from 'lucide-react';
import { GAS_CODE_GS, GAS_INDEX_HTML } from '../data/gasScript';

interface GasGuideModalProps {
  setShowGasGuide: (show: boolean) => void;
  lang: string;
}

export const GasGuideModal: React.FC<GasGuideModalProps> = ({
  setShowGasGuide,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'gs' | 'html'>('gs');
  const [copiedCode, setCopiedCode] = useState(false);

  const currentSnippet = activeTab === 'gs' ? GAS_CODE_GS : GAS_INDEX_HTML;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Code size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Google Apps Script (GAS) Code Snippets
              </h3>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-widest mt-0.5">
                {lang === 'mm' ? 'Code.gs နှင့် Index.html အတွက် ကုတ်များ' : 'Copy Code.gs and Index.html for Apps Script'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowGasGuide(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar font-sans text-slate-700 dark:text-slate-300 text-xs leading-relaxed flex-1">
          {/* Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
                Code.gs ထဲ ကုတ်ထည့်ရန်
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Apps Script ထဲရှိ `Code.gs` ထဲသို့ ဤစာမျက်နှာမှ Code.gs ကုတ်များကို ကူးယူ (Paste) လုပ်ပါ။
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
                Deploy Web App (အဓိက)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Deploy &gt; New deployment &gt; Select Web app<br />
                • Execute as: <b>Me</b><br />
                • Who has access: <b>Anyone</b> (မဖြစ်မနေ)
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-black">3</span>
                Update Version
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                ကုတ်ပြင်ပြီးတိုင်း:<br />
                Manage deployments &gt; Edit ✏️ &gt; <b>New Version</b> ရွေး၍ Deploy ပြန်နှိပ်ပါ။
              </p>
            </div>
          </div>

          {/* File Tab Switcher */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('gs')}
                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'gs'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileCode size={16} />
                <span>Code.gs</span>
              </button>

              <button
                onClick={() => setActiveTab('html')}
                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'html'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers size={16} />
                <span>Index.html</span>
              </button>
            </div>

            <button 
              onClick={handleCopyCode}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? 'Copied to Clipboard!' : `Copy ${activeTab === 'gs' ? 'Code.gs' : 'Index.html'}`}</span>
            </button>
          </div>

          {/* Code Viewer Box */}
          <div className="relative bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-[380px] custom-scrollbar">
            <pre className="whitespace-pre-wrap">{currentSnippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

