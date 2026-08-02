import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  User as UserIcon, 
  Edit, 
  Trash2, 
  Lock, 
  Minus, 
  Plus 
} from 'lucide-react';
import { User } from '../types';

interface StaffViewProps {
  staffMembers: User[];
  currentUser: User | null;
  showAddStaffForm: boolean;
  setShowAddStaffForm: (show: boolean) => void;
  editingStaff: User | null;
  setEditingStaff: (u: User | null) => void;
  handleSaveStaff: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDeleteStaff: (name: string) => void;
  isSaving: boolean;
  lang: string;
  t: (key: string) => string;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffMembers,
  currentUser,
  showAddStaffForm,
  setShowAddStaffForm,
  editingStaff,
  setEditingStaff,
  handleSaveStaff,
  handleDeleteStaff,
  isSaving,
  lang,
  t,
}) => {
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
          <Lock size={32} />
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('onlyAdminSettings')}</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-sans">
          {lang === 'mm' ? 'ဝန်ထမ်းအကောင့်များ စီမံခန့်ခွဲရန် Admin စီမံခန့်ခွဲသူ အကောင့်ဖြင့် ဝင်ရောက်ပါ။' : 'Only store managers and owners have access to manage staff accounts.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('staffManagement')}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{lang === 'mm' ? 'ဝန်ထမ်းအကောင့်များနှင့် PIN စီမံရန်' : 'Manage Users & Security PINs'}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowAddStaffForm(!showAddStaffForm);
              setEditingStaff(null);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            {showAddStaffForm ? <Minus size={15} /> : <Plus size={15} />}
            <span>{showAddStaffForm ? 'Cancel' : t('addStaff')}</span>
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddStaffForm && (
          <form onSubmit={handleSaveStaff} className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
              <UserPlus size={16} />
              <span>{editingStaff ? 'Edit Account' : 'Create New Account'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('staffName')}</label>
                <input 
                  name="staffName" 
                  type="text" 
                  required 
                  defaultValue={editingStaff ? editingStaff.name : ''}
                  placeholder="e.g. Mg Mg" 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('staffEmail')}</label>
                <input 
                  name="staffEmail" 
                  type="email" 
                  required 
                  defaultValue={editingStaff ? editingStaff.email : ''}
                  placeholder="staff@gmail.com" 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('staffPin')}</label>
                <input 
                  name="staffPIN" 
                  type="text" 
                  required 
                  maxLength={4}
                  pattern="[0-9]{4}"
                  defaultValue={editingStaff ? editingStaff.pin : ''}
                  placeholder="e.g. 5555" 
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-center tracking-widest outline-none text-slate-800 dark:text-slate-200" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('staffRole')}</label>
                <select 
                  name="staffRole" 
                  defaultValue={editingStaff ? editingStaff.role : 'Staff'}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Staff">Staff (Counter)</option>
                  <option value="Admin">Admin (Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('staffStatus')}</label>
                <select 
                  name="staffStatus" 
                  defaultValue={editingStaff ? editingStaff.status : 'Active'}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button"
                onClick={() => {
                  setShowAddStaffForm(false);
                  setEditingStaff(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md"
              >
                {isSaving ? t('saving') : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Staff List */}
        <div className="space-y-3 font-sans">
          {staffMembers && staffMembers.length > 0 ? (
            staffMembers.map((staff, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    staff.role === 'Admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400'
                  }`}>
                    {staff.role === 'Admin' ? <ShieldCheck size={20} /> : <UserIcon size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{staff.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        staff.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {staff.role}
                      </span>
                      {staff.status === 'Suspended' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-100 text-red-700">
                          Suspended
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium leading-none mt-1">{staff.email}</div>
                    {staff.pin && <div className="text-[10px] text-indigo-500 font-mono mt-1 font-bold">PIN: {staff.pin}</div>}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => {
                      setEditingStaff(staff);
                      setShowAddStaffForm(true);
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-colors shadow-xs"
                    title="Edit Staff"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteStaff(staff.name)}
                    disabled={staff.email === currentUser?.email}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-700 transition-colors shadow-xs disabled:opacity-30"
                    title="Delete Staff"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-400 italic text-xs">
              No staff profiles found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
