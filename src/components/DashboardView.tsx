import { formatUSDateTime } from '../utils/dateTime';
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wrench, 
  BarChart2, 
  CreditCard, 
  DollarSign, 
  Award, 
  Activity, 
  Lock, 
  Printer, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { SaleRecord, RepairJob, ExpenseRecord, InventoryItem, User, ReceiptData } from '../types';

interface DashboardViewProps {
  salesHistory: SaleRecord[];
  repairs: RepairJob[];
  expenses: ExpenseRecord[];
  inventory: InventoryItem[];
  currentUser: User | null;
  timeFilter: string;
  setTimeFilter: (f: string) => void;
  searchQuery: string;
  lang: string;
  t: (key: string) => string;
  handleReprintReceipt: (type: 'Official Voucher' | 'Repair Ticket', item: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  salesHistory,
  repairs,
  expenses,
  inventory,
  currentUser,
  timeFilter,
  setTimeFilter,
  searchQuery,
  lang,
  t,
  handleReprintReceipt,
}) => {
  const dashboardStats = useMemo(() => {
    const now = new Date();

    const isInRange = (dStr: string) => {
      if (!dStr || dStr === '-') return false;
      if (timeFilter === 'All Time') return true;

      const d = new Date(dStr);
      if (isNaN(d.getTime())) return true;

      if (timeFilter === 'Today') {
        return d.toDateString() === now.toDateString();
      }
      if (timeFilter === 'Week') {
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (timeFilter === 'Month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    };

    const salesFiltered = (salesHistory || []).filter(s => isInRange(s.timestamp));
    const repairsFiltered = (repairs || []).filter(r => isInRange(r.createdat));
    const expensesFiltered = (expenses || []).filter(e => isInRange(e.date));

    const salesRevenue = salesFiltered.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const repairRevenue = repairsFiltered.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalRevenue = salesRevenue + repairRevenue;
    const totalExpenses = expensesFiltered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const salesProfit = salesFiltered.reduce((sum, s) => {
      if ('profit' in s && s.profit !== undefined && s.profit !== null) {
        return sum + (Number(s.profit) || 0);
      }
      const cost = Number(s.costprice) || 0;
      return sum + ((Number(s.price) || 0) - cost);
    }, 0);

    const totalProfit = salesProfit + repairRevenue;
    const netProfit = totalProfit - totalExpenses;

    // Top Selling Items
    const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    salesFiltered.forEach(s => {
      const name = s.type || 'General Item';
      if (!productCounts[name]) {
        productCounts[name] = { name, count: 0, revenue: 0 };
      }
      productCounts[name].count += 1;
      productCounts[name].revenue += (Number(s.price) || 0);
    });
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Repaired Devices
    const repairCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    repairsFiltered.forEach(r => {
      const name = r.device || 'Unknown Device';
      if (!repairCounts[name]) {
        repairCounts[name] = { name, count: 0, revenue: 0 };
      }
      repairCounts[name].count += 1;
      repairCounts[name].revenue += (Number(r.total) || 0);
    });
    const topRepairs = Object.values(repairCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      salesRevenue,
      repairRevenue,
      totalRevenue,
      totalExpenses,
      totalProfit,
      netProfit,
      topProducts,
      topRepairs,
    };
  }, [salesHistory, repairs, expenses, timeFilter]);

  const filteredRepairs = useMemo(() => {
    return (repairs || []).filter(r => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(r.device).toLowerCase().includes(q) ||
        String(r.customername).toLowerCase().includes(q) ||
        String(r.phone).toLowerCase().includes(q) ||
        String(r.ticketid).toLowerCase().includes(q)
      );
    });
  }, [repairs, searchQuery]);

  const filteredSales = useMemo(() => {
    return (salesHistory || []).filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(s.type).toLowerCase().includes(q) ||
        String(s.customer).toLowerCase().includes(q) ||
        String(s.voucherno).toLowerCase().includes(q) ||
        String(s.phone).toLowerCase().includes(q) ||
        String(s.imei).toLowerCase().includes(q)
      );
    });
  }, [salesHistory, searchQuery]);

  const isStaff = currentUser?.role === 'Staff';

  return (
    <div className="space-y-6 pb-12">
      {/* Time Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-gray-100 dark:border-slate-800 shadow-xs gap-4">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span>{lang === 'mm' ? 'လုပ်ငန်းစွမ်းဆောင်ရည် စစ်ထုတ်ရန်' : 'Dashboard Overview'}</span>
        </h2>
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-md p-1 gap-1">
          {['Today', 'Week', 'Month', 'All Time'].map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                timeFilter === f
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              {f === 'Today' ? (lang === 'mm' ? 'ယနေ့' : 'Today') :
               f === 'Week' ? (lang === 'mm' ? 'ယခုပတ်' : 'This Week') :
               f === 'Month' ? (lang === 'mm' ? 'ယခုလ' : 'This Month') :
               (lang === 'mm' ? 'အားလုံး' : 'All Time')}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Financial Metric Cards with Left Border Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Sales Revenue */}
        <div className="p-4 bg-white dark:bg-slate-900 border-l-4 border-emerald-500 border-y border-r border-gray-100 dark:border-y-slate-800 dark:border-r-slate-800 rounded-sm shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-widest uppercase flex items-center gap-1.5">
              <ShoppingBag size={12} className="text-emerald-500" />
              <span>{t('salesRevenue')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              {(dashboardStats.salesRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">Ks</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 font-medium">
            {lang === 'mm' ? 'အရောင်းမှရငွေ' : 'From Product Sales'}
          </div>
        </div>

        {/* Repair Revenue */}
        <div className="p-4 bg-white dark:bg-slate-900 border-l-4 border-orange-500 border-y border-r border-gray-100 dark:border-y-slate-800 dark:border-r-slate-800 rounded-sm shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-widest uppercase flex items-center gap-1.5">
              <Wrench size={12} className="text-orange-500" />
              <span>{t('repairRevenue')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              {(dashboardStats.repairRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">Ks</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 font-medium">
            {lang === 'mm' ? 'ပြုပြင်ခရငွေ' : 'From Repair Service'}
          </div>
        </div>

        {/* Total Gross Revenue */}
        <div className="p-4 bg-white dark:bg-slate-900 border-l-4 border-indigo-600 border-y border-r border-gray-100 dark:border-y-slate-800 dark:border-r-slate-800 rounded-sm shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-widest uppercase flex items-center gap-1.5">
              <BarChart2 size={12} className="text-indigo-600" />
              <span>{t('totalRevenue')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              {(dashboardStats.totalRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">Ks</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 font-medium">
            {lang === 'mm' ? 'စုစုပေါင်းရငွေ' : 'Total Gross Income'}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 bg-white dark:bg-slate-900 border-l-4 border-red-500 border-y border-r border-gray-100 dark:border-y-slate-800 dark:border-r-slate-800 rounded-sm shadow-xs flex flex-col justify-between relative overflow-hidden">
          {isStaff && (
            <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-10">
              <Lock size={16} className="text-gray-400 mb-1" />
              <span className="text-[9px] font-bold uppercase text-gray-500">{t('costPricesHidden')}</span>
            </div>
          )}
          <div>
            <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-widest uppercase flex items-center gap-1.5">
              <CreditCard size={12} className="text-red-500" />
              <span>{t('expenditure')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              {(dashboardStats.totalExpenses || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">Ks</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 font-medium">
            {lang === 'mm' ? 'အထွေထွေအသုံးစရိတ်' : 'General Expenses'}
          </div>
        </div>

        {/* Total Profit */}
        <div className="p-4 bg-white dark:bg-slate-900 border-l-4 border-blue-500 border-y border-r border-gray-100 dark:border-y-slate-800 dark:border-r-slate-800 rounded-sm shadow-xs flex flex-col justify-between relative overflow-hidden">
          {isStaff && (
            <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-10">
              <Lock size={16} className="text-gray-400 mb-1" />
              <span className="text-[9px] font-bold uppercase text-gray-500">{t('costPricesHidden')}</span>
            </div>
          )}
          <div>
            <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-widest uppercase flex items-center gap-1.5">
              <TrendingUp size={12} className="text-blue-500" />
              <span>{t('totalProfit')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              {(dashboardStats.totalProfit || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">Ks</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 font-medium">
            {lang === 'mm' ? 'စုစုပေါင်းအမြတ်ငွေ' : 'Total Gross Profit'}
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-4 bg-white dark:bg-slate-900 border-l-4 border-emerald-600 border-y border-r border-gray-100 dark:border-y-slate-800 dark:border-r-slate-800 rounded-sm shadow-xs flex flex-col justify-between relative overflow-hidden">
          {isStaff && (
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-10">
              <Lock size={16} className="text-gray-400 mb-1" />
              <span className="text-[9px] font-bold uppercase text-gray-500">{t('costPricesHidden')}</span>
            </div>
          )}
          <div>
            <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 mb-1 tracking-widest uppercase flex items-center gap-1.5">
              <DollarSign size={12} className="text-emerald-600" />
              <span>{t('netProfit')}</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {(dashboardStats.netProfit || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">Ks</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 font-medium">
            {lang === 'mm' ? 'အမြတ် - အသုံးစရိတ်' : 'Profit - Expenses'}
          </div>
        </div>
      </div>

      {/* Top Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 font-bold flex justify-between items-center text-xs text-gray-700 dark:text-slate-200 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <span>{t('topSellingItems')}</span>
            </div>
            <span className="text-[10px] font-medium text-gray-400">({timeFilter})</span>
          </div>
          <div className="p-4 divide-y divide-gray-100 dark:divide-slate-800 custom-scrollbar overflow-y-auto max-h-[280px]">
            {dashboardStats.topProducts.length > 0 ? (
              dashboardStats.topProducts.map((prod, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      idx === 0 ? 'bg-indigo-600 text-white' :
                      idx === 1 ? 'bg-indigo-500 text-white' :
                      'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-gray-800 dark:text-slate-200 truncate">{prod.name}</div>
                      <div className="text-[10px] text-gray-400">{prod.count} {lang === 'mm' ? 'ကြိမ်ရောင်းချရမှု' : 'sales'}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-gray-800 dark:text-slate-200">{(prod.revenue).toLocaleString()} Ks</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 font-medium uppercase tracking-wider">
                {lang === 'mm' ? 'စစ်ထုတ်မှုအလိုက် အရောင်းမှတ်တမ်းမရှိပါ။' : 'No sales in filtered period.'}
              </div>
            )}
          </div>
        </div>

        {/* Top Repaired Devices */}
        <div className="bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 font-bold flex justify-between items-center text-xs text-gray-700 dark:text-slate-200 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-orange-500" />
              <span>{t('topRepairDevices')}</span>
            </div>
            <span className="text-[10px] font-medium text-gray-400">({timeFilter})</span>
          </div>
          <div className="p-4 divide-y divide-gray-100 dark:divide-slate-800 custom-scrollbar overflow-y-auto max-h-[280px]">
            {dashboardStats.topRepairs.length > 0 ? (
              dashboardStats.topRepairs.map((rep, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      idx === 0 ? 'bg-orange-500 text-white' :
                      idx === 1 ? 'bg-orange-400 text-white' :
                      'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-gray-800 dark:text-slate-200 truncate">{rep.name}</div>
                      <div className="text-[10px] text-gray-400">{rep.count} {lang === 'mm' ? 'ခေါက် ပြင်ဆင်ရမှု' : 'repairs'}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-gray-800 dark:text-slate-200">{(rep.revenue).toLocaleString()} Ks</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 font-medium uppercase tracking-wider">
                {lang === 'mm' ? 'စစ်ထုတ်မှုအလိုက် ပြုပြင်မှုမှတ်တမ်းမရှိပါ။' : 'No repairs in filtered period.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow & Active Repairs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 font-bold flex justify-between items-center text-xs text-gray-700 dark:text-slate-200 uppercase tracking-wider">
          <span>{t('serviceWorkflow')}</span>
          <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase">
            {(repairs || []).length} {t('active')}
          </span>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
          {filteredRepairs.length === 0 && filteredSales.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-xs font-semibold uppercase tracking-wider leading-relaxed">
              {searchQuery ? (lang === 'mm' ? 'ရှာဖွေမှု မတွေ့ရှိပါ။' : 'No matching records found.') : (lang === 'mm' ? 'လက်ရှိပြုပြင်နေသော ပစ္စည်းမရှိပါ။' : 'No active service jobs.')}
            </div>
          ) : (
            <React.Fragment>
              {filteredRepairs.map((job, idx) => (
                <div key={`rep-${idx}`} className="p-4 flex justify-between items-center px-6 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <Wrench size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-gray-800 dark:text-slate-100 truncate">{job.device}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">
                        {job.ticketid} • {job.customername} ({job.phone})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      job.status === 'Done' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                      job.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                      job.status === 'Reject' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                    }`}>
                      {job.status}
                    </span>
                    <button 
                      onClick={() => handleReprintReceipt('Repair Ticket', job)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Reprint Ticket"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredSales.map((sale, idx) => (
                <div key={`sale-${idx}`} className="p-4 flex justify-between items-center px-6 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                      <ShoppingBag size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-gray-800 dark:text-slate-100 truncate">{sale.type}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">
                        {sale.voucherno || 'Voucher'} • {sale.customer} • {formatUSDateTime(sale.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="font-bold text-xs text-gray-800 dark:text-slate-200">
                      {(Number(sale.price) || 0).toLocaleString()} <span className="text-[10px] text-gray-400">Ks</span>
                    </div>
                    <button 
                      onClick={() => handleReprintReceipt('Official Voucher', sale)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Reprint Voucher"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};
