import React from 'react';
import { 
  Wrench, 
  Plus, 
  X, 
  Printer, 
  Save, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { RepairJob, RepairStatus, User } from '../types';
import { formatUSDateTime } from '../utils/dateTime';

interface RepairsViewProps {
  repairs: RepairJob[];
  searchQuery: string;
  statusFilter: string;
  showRepairModal: boolean;
  setShowRepairModal: (show: boolean) => void;
  handleSaveRepair: (e: React.FormEvent<HTMLFormElement>) => void;
  handleUpdateStatus: (ticketId: string, status: RepairStatus) => void;
  handleReprintReceipt: (type: 'Official Voucher' | 'Repair Ticket', item: any) => void;
  isSaving: boolean;
  lang: string;
  t: (key: string) => string;
}

export const RepairsView: React.FC<RepairsViewProps> = ({
  repairs,
  searchQuery,
  statusFilter,
  showRepairModal,
  setShowRepairModal,
  handleSaveRepair,
  handleUpdateStatus,
  handleReprintReceipt,
  isSaving,
  lang,
  t,
}) => {
  const filteredRepairs = (repairs || []).filter(job => {
    const matchSearch = searchQuery ? (
      String(job.device).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(job.customername).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(job.phone).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(job.ticketid).toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;

    const matchStatus = statusFilter === 'All' ? true : job.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('repairs')}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{lang === 'mm' ? 'ဖုန်းပြုပြင်ရေး ဝန်ဆောင်မှုမှတ်တမ်းများ' : 'Service Jobs & Workflows'}</p>
        </div>

        <button 
          onClick={() => setShowRepairModal(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={16} />
          <span>{t('newJob')}</span>
        </button>
      </div>

      {/* Repair Tickets Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {filteredRepairs.length === 0 ? (
            <div className="p-20 text-center text-slate-400 italic font-bold uppercase tracking-widest text-xs">
              {t('warehouseEmpty')}
            </div>
          ) : (
            filteredRepairs.map((job, i) => (
              <div key={i} className="p-5 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Wrench size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>{job.device}</span>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                        {job.ticketid}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Customer: <strong className="text-slate-700 dark:text-slate-200">{job.customername}</strong> ({job.phone})
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-bold">
                      <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        Start Time: {formatUSDateTime(job.starttime || job.createdat)}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Finish Time: {formatUSDateTime(job.finishtime)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                      Issue: {job.issue}
                    </div>
                    {job.remark && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold italic mt-0.5">
                        Remark: {job.remark}
                      </div>
                    )}
                    {(job.imeisn || job.initialcondition) && (
                      <div className="text-[10px] text-blue-500 font-mono font-bold uppercase mt-1 flex flex-wrap gap-2">
                        {job.imeisn && <span>IMEI/SN: {job.imeisn}</span>}
                        {job.initialcondition && <span>Condition: {job.initialcondition}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                  <div className="flex flex-col items-end">
                    <select 
                      value={job.status} 
                      onChange={(e) => handleUpdateStatus(job.ticketid, e.target.value as RepairStatus)}
                      className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer ${
                        (job.status === 'Done' || job.status === 'Delivered') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400' :
                        job.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400' :
                        job.status === 'Reject' ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400' :
                        job.status === 'Delivered' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-400'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Repairing">Repairing</option>
                      <option value="Done">Done</option>
                      <option value="Reject">Reject</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">
                      {(Number(job.total) || 0).toLocaleString()} <span className="text-[10px]">MMK</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleReprintReceipt('Repair Ticket', job)}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-500 dark:text-slate-400 transition-all"
                    title="Print Receipt Ticket"
                  >
                    <Printer size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Job Modal */}
      {showRepairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('newJob')}</h3>
              <button onClick={() => setShowRepairModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveRepair} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 px-4 py-3 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                Repair Start Time is recorded automatically when this ticket is saved. Finish Time is recorded automatically when status changes to Done, Delivered, or Reject. Changing the job back to Pending or Repairing clears Finish Time. All times use US English format (MM/DD/YYYY, hh:mm:ss AM/PM) on the webpage and Google Sheet.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('customer')}</label>
                  <input name="customer" required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" placeholder="e.g. Ko Kyaw" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('phone')}</label>
                  <input name="phone" required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" placeholder="09xxxxxxx" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('device')}</label>
                  <input name="device" required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" placeholder="Samsung S23" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">IMEI / SN</label>
                  <input name="imei" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" placeholder="Enter IMEI or Serial" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('initialCondition')}</label>
                <input name="condition" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200" placeholder="e.g. Back glass cracked, Screen white out" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('issue')}</label>
                <textarea name="issue" required rows={3} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200 resize-none" placeholder="Describe issue in detail..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('total')} (MMK)</label>
                  <input name="total" type="number" required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-black outline-none text-blue-600 dark:text-blue-400" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Remark</label>
                  <input name="remark" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200" placeholder="Note..." />
                </div>
              </div>

              <button disabled={isSaving} type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs flex items-center justify-center gap-2 mt-4">
                {isSaving ? t('saving') : <React.Fragment><Save size={16} /> Save Repair Ticket</React.Fragment>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
