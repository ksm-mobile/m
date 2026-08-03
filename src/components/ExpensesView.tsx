import { formatUSDate } from '../utils/dateTime';
import React from 'react';
import { 
  Wallet, 
  Plus, 
  X, 
  Receipt, 
  Save 
} from 'lucide-react';
import { ExpenseRecord, FinancialReport } from '../types';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  report: FinancialReport;
  showExpenseModal: boolean;
  setShowExpenseModal: (show: boolean) => void;
  handleSaveExpense: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  lang: string;
  t: (key: string) => string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  report,
  showExpenseModal,
  setShowExpenseModal,
  handleSaveExpense,
  isSaving,
  lang,
  t,
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Cards Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-800 dark:text-white">
          <div className="text-[10px] font-black text-slate-400 mb-1 tracking-widest uppercase">{t('expenditure')}</div>
          <div className="text-3xl font-black italic">{(report.expenses || 0).toLocaleString()} <span className="text-xs">MMK</span></div>
        </div>

        <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black text-slate-500 mb-1 tracking-widest uppercase">{t('quickAdd')}</div>
            <div className="text-base font-black">{t('logExpense')}</div>
          </div>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 font-black text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {t('entries')} ({expenses.length})
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {expenses && expenses.length > 0 ? (
            expenses.map((ex, i) => (
              <div key={i} className="p-5 flex justify-between items-center px-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{ex.description}</div>
                    <div className="flex gap-2 items-center mt-0.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{ex.category}</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatUSDate(ex.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="font-black text-red-600 dark:text-red-400 text-base">
                  - {(Number(ex.amount) || 0).toLocaleString()} <span className="text-xs">MMK</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-slate-400 italic text-xs font-black uppercase tracking-widest">
              {lang === 'mm' ? 'မှတ်တမ်း မတွေ့ရှိပါ။' : 'No expense entries found.'}
            </div>
          )}
        </div>
      </div>

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('logExpense')}</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('description')}</label>
                <input name="description" required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" placeholder="e.g. Shop Wifi & Electricity" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('category')}</label>
                  <select name="category" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer">
                    <option value="General">General</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Salary">Salary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('total')} (MMK)</label>
                  <input name="amount" type="number" required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-black outline-none text-red-600 dark:text-red-400" placeholder="0" />
                </div>
              </div>

              <button disabled={isSaving} type="submit" className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs flex items-center justify-center gap-2 mt-4">
                {isSaving ? t('saving') : <React.Fragment><Save size={16} /> Save Expense</React.Fragment>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
