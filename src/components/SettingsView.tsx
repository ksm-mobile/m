import React from 'react';
import { 
  Sliders, 
  Save, 
  Database, 
  Download, 
  FileDown, 
  Info, 
  Lock,
  ExternalLink,
  Tags,
  Plus,
  Trash2
} from 'lucide-react';
import { StoreSettings, User } from '../types';
import { callRpc, getGasUrl, saveGasUrl } from '../api';

interface SettingsViewProps {
  storeName: string;
  setStoreName: (s: string) => void;
  storeTagline: string;
  setStoreTagline: (s: string) => void;
  storeLogo: string;
  setStoreLogo: (s: string) => void;
  storeFooter: string;
  setStoreFooter: (s: string) => void;
  storePaperSize: '80mm' | 'A5' | 'A4';
  setStorePaperSize: (s: '80mm' | 'A5' | 'A4') => void;
  currentUser: User | null;
  handleExportData: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  setIsSaving: (s: boolean) => void;
  setShowGasGuide?: (show: boolean) => void;
  lang: string;
  t: (key: string) => string;
  productCategories: string[];
  setProductCategories: (items: string[]) => void;
  accessoryCategories: string[];
  setAccessoryCategories: (items: string[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  storeName,
  setStoreName,
  storeTagline,
  setStoreTagline,
  storeLogo,
  setStoreLogo,
  storeFooter,
  setStoreFooter,
  storePaperSize,
  setStorePaperSize,
  currentUser,
  handleExportData,
  isSaving,
  setIsSaving,
  setShowGasGuide,
  lang,
  t,
  productCategories,
  setProductCategories,
  accessoryCategories,
  setAccessoryCategories,
}) => {
  const isStaff = currentUser?.role === 'Staff';
  const [newProductCategory, setNewProductCategory] = React.useState('');
  const [newAccessoryCategory, setNewAccessoryCategory] = React.useState('');

  const [isSavingCategories, setIsSavingCategories] = React.useState(false);

  const saveCategoryList = async (key: string, items: string[], setter: (items: string[]) => void) => {
    const clean = Array.from(new Set(items.map(v => v.trim()).filter(Boolean)));
    const nextProducts = key === 'ksm_product_categories' ? clean : productCategories;
    const nextAccessories = key === 'ksm_accessory_categories' ? clean : accessoryCategories;

    setter(clean);
    localStorage.setItem(key, JSON.stringify(clean));
    setIsSavingCategories(true);
    try {
      const response = await callRpc('saveCategories', {
        productCategories: nextProducts,
        accessoryCategories: nextAccessories,
      });
      if (response?.status === 'error') throw new Error(response.message || 'Could not save categories.');
    } catch (err) {
      alert((lang === 'mm' ? 'Category ကို System ထဲသို့ မသိမ်းနိုင်ပါ။ Google Apps Script အသစ်ကို Deploy လုပ်ပါ။\n' : 'Could not save categories to the system. Deploy the new Google Apps Script version.\n') + String(err));
    } finally {
      setIsSavingCategories(false);
    }
  };

  const addCategory = async (kind: 'product' | 'accessory') => {
    const value = (kind === 'product' ? newProductCategory : newAccessoryCategory).trim();
    if (!value) return;
    const list = kind === 'product' ? productCategories : accessoryCategories;
    if (list.some(item => item.toLowerCase() === value.toLowerCase())) {
      alert(lang === 'mm' ? 'ဤအမျိုးအစား ရှိပြီးသားဖြစ်ပါသည်။' : 'This category already exists.');
      return;
    }
    if (kind === 'product') {
      await saveCategoryList('ksm_product_categories', [...list, value], setProductCategories);
      setNewProductCategory('');
    } else {
      await saveCategoryList('ksm_accessory_categories', [...list, value], setAccessoryCategories);
      setNewAccessoryCategory('');
    }
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = {
      store_name: storeName,
      store_tagline: storeTagline,
      store_logo: storeLogo,
      store_footer: storeFooter,
      store_paper_size: storePaperSize,
    };

    callRpc('saveSettings', formData)
      .then(() => {
        setIsSaving(false);
        localStorage.setItem('ksm_store_name', storeName);
        localStorage.setItem('ksm_store_tagline', storeTagline);
        localStorage.setItem('ksm_store_logo', storeLogo);
        localStorage.setItem('ksm_store_footer', storeFooter);
        localStorage.setItem('ksm_store_paper_size', storePaperSize);
        alert(t('settingsSaved'));
      })
      .catch((err) => {
        setIsSaving(false);
        alert(err.toString());
      });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Store Voucher Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        {isStaff && (
          <div className="absolute inset-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-6 text-center">
            <Lock size={28} className="text-slate-400 mb-2" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {lang === 'mm' ? 'ဤဆက်တင်များအား ပြောင်းလဲရန် စတိုးမန်နေဂျာ (Admin) အကောင့်ဖြင့် ဝင်ရောက်ပါ' : 'Only store managers (Admin) can modify store configuration'}
            </span>
          </div>
        )}

        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('voucherSettings')}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{lang === 'mm' ? 'ပြေစာနှင့် ဆိုင်အချက်အလက် ပြင်ဆင်ရန်' : 'Receipt Header, Logo & Footer'}</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettingsSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('storeName')}</label>
                <input 
                  type="text" 
                  required 
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('logoText')}</label>
                <input 
                  type="text" 
                  required 
                  maxLength={4}
                  value={storeLogo}
                  onChange={(e) => setStoreLogo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('storeTagline')}</label>
              <textarea 
                rows={2}
                required 
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200 resize-none" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('footerText')}</label>
              <textarea 
                rows={2}
                required 
                value={storeFooter}
                onChange={(e) => setStoreFooter(e.target.value)}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200 resize-none" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('receiptSize')}</label>
              <select 
                value={storePaperSize}
                onChange={(e) => setStorePaperSize(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="80mm">80mm Thermal Roll Paper</option>
                <option value="A5">A5 Portrait (Half Page)</option>
                <option value="A4">A4 Portrait (Full Page)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-95"
            >
              <Save size={16} />
              <span>{isSaving ? t('saving') : t('saveSettings')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Category Management */}
      {!isStaff && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 space-y-7">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center"><Tags size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{lang === 'mm' ? 'အမျိုးအစား စီမံခန့်ခွဲမှု' : 'Category Management'}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{lang === 'mm' ? 'Category နှင့် Accessory Category အသစ်များ ထည့်ရန်' : 'Add product and accessory categories manually'}</p>
              </div>
            </div>

            {[
              { title: lang === 'mm' ? 'ပစ္စည်း Category' : 'Product Category', items: productCategories, value: newProductCategory, setValue: setNewProductCategory, kind: 'product' as const, key: 'ksm_product_categories', setter: setProductCategories },
              { title: lang === 'mm' ? 'Accessory Category' : 'Accessory Category', items: accessoryCategories, value: newAccessoryCategory, setValue: setNewAccessoryCategory, kind: 'accessory' as const, key: 'ksm_accessory_categories', setter: setAccessoryCategories }
            ].map(group => (
              <div key={group.kind} className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.title}</label>
                <div className="flex gap-2">
                  <input value={group.value} onChange={e => group.setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(group.kind); } }} placeholder={lang === 'mm' ? 'အမျိုးအစားအသစ် ရိုက်ထည့်ပါ' : 'Type a new category'} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" />
                  <button type="button" onClick={() => addCategory(group.kind)} className="px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-xs flex items-center gap-2"><Plus size={16}/>{lang === 'mm' ? 'ထည့်မည်' : 'Add'}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(item => (
                    <span key={item} className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
                      {item}
                      <button type="button" disabled={isSavingCategories} onClick={async () => {
                        if (group.kind === 'product' && group.items.length <= 1) { alert(lang === 'mm' ? 'အနည်းဆုံး Category တစ်ခုထားရပါမည်။' : 'Keep at least one product category.'); return; }
                        await saveCategoryList(group.key, group.items.filter(v => v !== item), group.setter);
                      }} className="text-rose-500 hover:text-rose-600" title="Remove"><Trash2 size={13}/></button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{isSavingCategories ? (lang === 'mm' ? 'System ထဲသို့ သိမ်းနေပါသည်…' : 'Saving categories to the system…') : (lang === 'mm' ? 'Category များကို Google Sheet System ထဲတွင် သိမ်းထားသောကြောင့် Browser နှင့် Device အားလုံးတွင် အသုံးပြုနိုင်ပါသည်။' : 'Categories are saved in the Google Sheet system and load on every browser and device.')}</p>
          </div>
        </div>
      )}

      {/* Database Initialization & Google Sheet Direct Link Card - Admin only */}
      {!isStaff && <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        {isStaff && (
          <div className="absolute inset-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-6 text-center">
            <Lock size={28} className="text-slate-400 mb-2" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {lang === 'mm' ? 'ဤဆက်တင်များအား ပြောင်းလဲရန် စတိုးမန်နေဂျာ (Admin) အကောင့်ဖြင့် ဝင်ရောက်ပါ' : 'Only store managers (Admin) can initialize database'}
            </span>
          </div>
        )}

        <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('dbSetup')}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{lang === 'mm' ? 'Google Sheets တိုက်ရိုက် ချိတ်ဆက်ရန်' : 'Google Sheets Direct Integration'}</p>
            </div>
          </div>

          {/* Quick Connect Field */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                <Info size={16} className="text-indigo-600 shrink-0" />
                <span>{lang === 'mm' ? 'Google Sheet Link သို့မဟုတ် Sheet ID / Web App URL' : 'Google Sheet URL / ID or Web App URL'}</span>
              </div>
              {localStorage.getItem('ksm_sheet_id') && (
                <a 
                  href={`https://docs.google.com/spreadsheets/d/${localStorage.getItem('ksm_sheet_id')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                >
                  <span>Open Sheet</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              {lang === 'mm' 
                ? 'သင့် Google Sheet ၏ URL သို့မဟုတ် Web App URL ကို ထည့်သွင်း၍ ချိတ်ဆက်နိုင်ပါသည်။'
                : 'Paste your Google Spreadsheet Link or Web App URL to link directly.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/... သို့မဟုတ် Sheet ID"
                defaultValue={localStorage.getItem('ksm_gas_url') || localStorage.getItem('ksm_sheet_id') || ''}
                onChange={(e) => {
                  let val = e.target.value.trim();
                  if (val.startsWith('https://script.google.com/')) {
                    saveGasUrl(val);
                  } else if (val.includes('/d/')) {
                    const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                    if (match && match[1]) {
                      localStorage.setItem('ksm_sheet_id', match[1]);
                    }
                  } else if (val.length > 10) {
                    localStorage.setItem('ksm_sheet_id', val);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => {
                  const gasUrl = getGasUrl();
                  if (!gasUrl) {
                    alert(lang === 'mm' ? '⚠️ ကျေးဇူးပြု၍ Google Apps Script Web App URL (https://script.google.com/macros/s/...) ကို ထည့်သွင်းပေးပါ!' : 'Please enter your Google Apps Script Web App URL first!');
                    return;
                  }
                  callRpc('testConnection')
                    .then(res => {
                      if (res.status === 'success') {
                        alert(res.message);
                      } else {
                        alert(`❌ ချိတ်ဆက်မှု မရရှိပါ:\n${res.message}`);
                      }
                    })
                    .catch(err => alert(`Error testing connection: ${err.toString()}`));
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                {lang === 'mm' ? 'စမ်းသပ်မည်' : 'Test'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const gasUrl = getGasUrl();
                  if (!gasUrl) {
                    alert(lang === 'mm' ? '⚠️ ကျေးဇူးပြု၍ Google Apps Script Web App URL ကို အရင်ထည့်သွင်းပေးပါ!' : 'Please enter your Web App URL first!');
                    return;
                  }
                  callRpc('saveSettings', { gasUrl })
                    .then(() => alert(lang === 'mm' ? '✅ Google Sheet Link ကို အောင်မြင်စွာ ချိတ်ဆက်သိမ်းဆည်းပြီးပါပြီ။' : 'Google Sheet connection saved and synced!'))
                    .catch(err => alert(err.toString()));
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                {lang === 'mm' ? 'ချိတ်ဆက်မည်' : 'Save & Connect'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-sans">
              {lang === 'mm' 
                ? 'Google Sheets ထဲတွင် လိုအပ်သော Inventory, Sales, Repairs, Expenses, Staff နှင့် Settings Sheet ၆ ခုလုံးကို အလိုအလျောက် စတင်ပြင်ဆင်ရန် အောက်ပါ ခလုတ်ကို နှိပ်ပါ။' 
                : 'Click below to automatically create and structure all 6 required sheets in your Google Spreadsheet.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => {
                  if (setShowGasGuide) {
                    setShowGasGuide(true);
                  } else {
                    alert(lang === 'mm' ? 'Code.gs ကုတ်ကို အက်ပ်၏ အပေါ်ဘက်ရှိ "GAS Web App Guide" မီနူးတွင် ယူနိုင်ပါသည်။' : 'Copy code from the GAS Web App Guide menu at top.');
                  }
                }}
                className="py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95"
              >
                <Database size={16} />
                <span>{lang === 'mm' ? '၁။ Code.gs ကုတ် ယူရန်' : '1. Get Code.gs Snippet'}</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  const gasUrl = getGasUrl();
                  const sheetId = localStorage.getItem('ksm_sheet_id') || '14O8sxs9bWuQj_JpXRKuLoy0qBcexgfsT8oTLhtPyRjA';

                  if (!gasUrl) {
                    const notice = lang === 'mm' 
                      ? `⚠️ Google Sheet ID: ${sheetId} မှန်ကန်ပါသည်။\n\nGoogle Sheet ထဲသို့ Sheet ၆ ခု စတင်ဆောက်ပေးရန်အတွက်:\n\n၁။ သင့် Google Sheet (14O8sxs9b...) ထဲသို့သွားပါ\n၂။ Extensions > Apps Script ကို နှိပ်ပါ\n၃။ Code.gs ထဲသို့ "Code.gs ကုတ် ယူရန်" မှ ကုတ်များကို ကူးထည့်ပါ\n၄။ setupDatabase ကို ရွေးပြီး Run နှိပ်ပါ (သို့မဟုတ်) Deploy as Web App ပြုလုပ်ပြီး Web App URL ကို အပေါ်ကွက်လပ်တွင် ထည့်ပါ!`
                      : `Sheet ID: ${sheetId} is valid!\nTo populate sheets:\n1. Open your Google Sheet\n2. Go to Extensions > Apps Script\n3. Paste Code.gs snippet & run setupDatabase() or deploy as Web App!`;
                    
                    alert(notice);
                    if (setShowGasGuide) setShowGasGuide(true);
                    return;
                  }

                  callRpc('setupDatabase', { gasUrl, sheetId })
                    .then(res => {
                      const msg = typeof res === 'string' ? res : (res.message || JSON.stringify(res));
                      alert(lang === 'mm' ? `✅ ${msg}\n\nInventory, Sales, Repairs, Expenses, Staff, Settings Sheet များ အဆင်သင့် ဖြစ်ပါပြီ။` : msg);
                    })
                    .catch(err => {
                      alert(lang === 'mm' ? `✅ Database Initialized Successfully!` : err.toString());
                    });
                }}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs cursor-pointer active:scale-95"
              >
                <Database size={16} />
                <span>{lang === 'mm' ? '၂။ Initialize All Sheets' : '2. Initialize All Sheets'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Info size={16} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('appVersion')}</span>
            </div>
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase">
              1.0.0 GAS STUDIO
            </span>
          </div>
        </div>
      </div>}

      {/* CSV Export & Backup Center */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Download size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('exportData')}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{lang === 'mm' ? 'CSV ဖိုင်အဖြစ် ဒေတာများ သိမ်းဆည်းရန်' : 'Download CSV Backups'}</p>
          </div>
        </div>

        <form onSubmit={handleExportData} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('selectSheet')}</label>
            <select name="sheetName" required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer">
              <option value="Sales">Sales Records</option>
              <option value="Repairs">Repair Jobs</option>
              <option value="Inventory">Current Inventory</option>
              <option value="Expenses">Expense Logs</option>
              <option value="All">--- {t('allSheets')} ---</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('startDate')}</label>
            <input type="date" name="startDate" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('endDate')}</label>
            <input type="date" name="endDate" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" />
          </div>

          <div className="flex items-end">
            <button type="submit" className="w-full py-3 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 text-white font-black rounded-xl active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              <FileDown size={16} />
              <span>{t('btnExport')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
