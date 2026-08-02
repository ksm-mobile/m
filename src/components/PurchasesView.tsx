import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X, Save, Truck, PackagePlus, Search, RotateCcw } from 'lucide-react';
import { InventoryItem, PurchaseRecord } from '../types';

interface Props {
  purchases: PurchaseRecord[];
  inventory: InventoryItem[];
  showPurchaseModal: boolean;
  setShowPurchaseModal: (show: boolean) => void;
  handleSavePurchase: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  lang: string;
}

type Draft = { productId:string; supplier:string; invoiceNo:string; quantity:string; unitCost:string; paidAmount:string; paymentMethod:string; remark:string; costMode:string };
const blankDraft: Draft = { productId:'', supplier:'', invoiceNo:'', quantity:'1', unitCost:'', paidAmount:'0', paymentMethod:'Cash', remark:'', costMode:'average' };

export const PurchasesView: React.FC<Props> = ({ purchases, inventory, showPurchaseModal, setShowPurchaseModal, handleSavePurchase, isSaving, lang }) => {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const total = safePurchases.reduce((s, p) => s + Number(p.total || 0), 0);
  const paid = safePurchases.reduce((s, p) => s + Number(p.paidamount || 0), 0);
  const due = Math.max(0, total - paid);
  const filtered = useMemo(() => safePurchases.filter(p => `${p.supplier} ${p.productname} ${p.productid} ${p.invoiceno}`.toLowerCase().includes(query.toLowerCase())), [safePurchases, query]);

  useEffect(() => { if (!showPurchaseModal) setDraft(blankDraft); }, [showPurchaseModal]);
  const set = (key:keyof Draft, value:string) => setDraft(d => ({...d,[key]:value}));

  const loadLastPurchase = (productId:string) => {
    const last = [...safePurchases].reverse().find(p => String(p.productid) === String(productId));
    const product = safeInventory.find(p => String(p.id || p.productid) === String(productId));
    setDraft(d => ({
      ...d,
      productId,
      supplier: String(last?.supplier || d.supplier || ''),
      invoiceNo: '',
      quantity: '1',
      unitCost: String(last?.unitcost ?? product?.costprice ?? product?.costPrice ?? ''),
      paidAmount: '0',
      paymentMethod: String(last?.paymentmethod || 'Cash'),
      remark: String(last?.remark || ''),
    }));
  };

  const reusePurchase = (p:PurchaseRecord) => {
    setDraft({ productId:String(p.productid||''), supplier:String(p.supplier||''), invoiceNo:'', quantity:'1', unitCost:String(p.unitcost||''), paidAmount:'0', paymentMethod:String(p.paymentmethod||'Cash'), remark:String(p.remark||''), costMode:'average' });
    setShowPurchaseModal(true);
  };

  return <div className="space-y-6 pb-12">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Summary label={lang === 'mm' ? 'စုစုပေါင်းဝယ်ယူမှု' : 'Total Purchases'} value={total} />
      <Summary label={lang === 'mm' ? 'ပေးချေပြီး' : 'Paid'} value={paid} />
      <Summary label={lang === 'mm' ? 'ပေးရန်ကျန်' : 'Amount Due'} value={due} />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 justify-between">
      <div className="relative flex-1 max-w-lg"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={lang === 'mm' ? 'Supplier / ပစ္စည်း ရှာရန်...' : 'Search supplier, product or invoice...'} className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none"/></div>
      <button onClick={()=>setShowPurchaseModal(true)} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2"><Plus size={17}/>{lang === 'mm' ? 'ဝယ်ယူမှုအသစ်' : 'New Purchase'}</button>
    </div>
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 font-black text-xs uppercase">{lang === 'mm' ? 'ဝယ်ယူမှုမှတ်တမ်း' : 'Purchase History'} ({filtered.length})</div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length ? filtered.map((p,i)=><div key={`${p.purchaseno}-${i}`} className="p-5 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
          <div className="md:col-span-2 flex gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600"><Truck size={18}/></div><div><div className="font-black text-sm">{p.productname || p.productid}</div><div className="text-[10px] text-slate-400">{p.supplier} • {p.date}</div></div></div>
          <div className="text-xs"><span className="text-slate-400">Qty:</span> <b>{p.quantity}</b><br/><span className="text-slate-400">Cost:</span> <b>{Number(p.unitcost||0).toLocaleString()}</b></div>
          <div className="text-xs"><span className="text-slate-400">Invoice:</span> <b>{p.invoiceno || '-'}</b><br/><span className="text-slate-400">Payment:</span> <b>{p.paymentmethod}</b></div>
          <div><div className="font-black">{Number(p.total||0).toLocaleString()} MMK</div><div className={`text-[10px] font-bold ${Number(p.balance||0)>0?'text-amber-500':'text-emerald-500'}`}>{Number(p.balance||0)>0?`Due ${Number(p.balance).toLocaleString()}`:'PAID'}</div></div>
          <button onClick={()=>reusePurchase(p)} className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1"><RotateCcw size={14}/>{lang==='mm'?'ပြန်ဝယ်':'Buy Again'}</button>
        </div>) : <div className="p-16 text-center text-slate-400 text-xs font-bold">{lang === 'mm' ? 'ဝယ်ယူမှုမှတ်တမ်း မရှိသေးပါ။' : 'No purchase records yet.'}</div>}
      </div>
    </div>

    {showPurchaseModal && <div className="fixed inset-0 z-50 bg-slate-950/70 p-3 flex items-center justify-center"><div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="p-5 flex justify-between border-b border-slate-100 dark:border-slate-800"><h3 className="font-black flex gap-2"><PackagePlus size={20}/>{lang === 'mm'?'စတော့ဝယ်ယူမှု ထည့်ရန်':'Add Stock Purchase'}</h3><button onClick={()=>setShowPurchaseModal(false)}><X/></button></div>
      <form onSubmit={handleSavePurchase} className="p-5 space-y-4">
        <Field label={lang==='mm'?'ပစ္စည်းရွေးပါ':'Inventory Product'}><select name="productId" required className="input" value={draft.productId} onChange={e=>loadLastPurchase(e.target.value)}><option value="">-- Select product --</option>{safeInventory.map(p=><option key={p.id||p.productid} value={p.id||p.productid}>{p.brand} {p.model} (Stock: {p.stock})</option>)}</select></Field>
        {draft.productId && <div className="text-[11px] rounded-xl bg-blue-50 dark:bg-slate-800 p-3">{lang==='mm'?'နောက်ဆုံးဝယ်ယူခဲ့သော Supplier နှင့် Unit Cost ကို အလိုအလျောက်ဖြည့်ထားပါသည်။ လိုသလိုပြင်နိုင်ပါသည်။':'Last supplier and unit cost were loaded automatically. You can change them.'}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label={lang==='mm'?'ပစ္စည်းပေးသွင်းသူ':'Supplier'}><input name="supplier" required className="input" value={draft.supplier} onChange={e=>set('supplier',e.target.value)}/></Field><Field label="Invoice No"><input name="invoiceNo" className="input" value={draft.invoiceNo} onChange={e=>set('invoiceNo',e.target.value)}/></Field></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Field label={lang==='mm'?'အရေအတွက်':'Quantity'}><input name="quantity" type="number" min="1" required className="input" value={draft.quantity} onChange={e=>set('quantity',e.target.value)}/></Field><Field label={lang==='mm'?'တစ်ခုဝယ်စျေး':'Unit Cost (MMK)'}><input name="unitCost" type="number" min="0" required className="input" value={draft.unitCost} onChange={e=>set('unitCost',e.target.value)}/></Field><Field label={lang==='mm'?'ပေးချေပြီးငွေ':'Paid Amount'}><input name="paidAmount" type="number" min="0" className="input" value={draft.paidAmount} onChange={e=>set('paidAmount',e.target.value)}/></Field></div>
        <Field label={lang==='mm'?'Inventory Cost Price ပြင်နည်း':'Inventory Cost Price Method'}><select name="costMode" className="input" value={draft.costMode} onChange={e=>set('costMode',e.target.value)}><option value="average">Weighted Average — old stock + new purchase</option><option value="latest">Update to New Price — use this purchase price</option><option value="keep">Keep Old Price — do not change inventory cost</option></select></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label={lang==='mm'?'ငွေပေးချေမှု':'Payment Method'}><select name="paymentMethod" className="input" value={draft.paymentMethod} onChange={e=>set('paymentMethod',e.target.value)}><option>Cash</option><option>Bank Transfer</option><option>KBZPay</option><option>WavePay</option><option>Credit</option></select></Field><Field label={lang==='mm'?'မှတ်ချက်':'Remark'}><input name="remark" className="input" value={draft.remark} onChange={e=>set('remark',e.target.value)}/></Field></div>
        <button disabled={isSaving} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs flex justify-center gap-2"><Save size={16}/>{isSaving?'Saving...':(lang==='mm'?'ဝယ်ယူမှုသိမ်းမည်':'Save Purchase')}</button>
      </form>
    </div></div>}
  </div>;
};

const Summary=({label,value}:{label:string,value:number})=><div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"><div className="text-[10px] text-slate-400 font-black uppercase">{label}</div><div className="text-2xl font-black mt-1">{value.toLocaleString()} <span className="text-xs">MMK</span></div></div>;
const Field=({label,children}:{label:string,children:React.ReactNode})=><label className="block"><span className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{label}</span>{children}</label>;
