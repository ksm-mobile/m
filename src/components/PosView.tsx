import { formatUSDateTime } from '../utils/dateTime';
import React, { useState, useMemo, useRef } from 'react';
import { 
  ShoppingCart, 
  Receipt, 
  Plus, 
  X, 
  Tag, 
  Search, 
  CheckCircle, 
  Trash2, 
  Shield, 
  Printer, 
  DollarSign, 
  Gift,
  ScanLine
} from 'lucide-react';
import { InventoryItem, CartItem, SaleRecord, User } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface PosViewProps {
  inventory: InventoryItem[];
  salesHistory: SaleRecord[];
  posCart: CartItem[];
  setPosCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  handleAddToPosCart: (p: InventoryItem) => void;
  showSaleModal: boolean;
  setShowSaleModal: (show: boolean) => void;
  selectedProduct: CartItem | InventoryItem | null;
  setSelectedProduct: (p: CartItem | InventoryItem | null) => void;
  handleSaveSale: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  currentUser: User | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  lang: string;
  t: (key: string) => string;
  handleReprintReceipt: (type: 'Official Voucher' | 'Repair Ticket', item: any) => void;
  refreshAll: () => void;
  productCategories: string[];
}

export const PosView: React.FC<PosViewProps> = ({
  inventory,
  salesHistory,
  posCart,
  setPosCart,
  handleAddToPosCart,
  showSaleModal,
  setShowSaleModal,
  selectedProduct,
  setSelectedProduct,
  handleSaveSale,
  isSaving,
  currentUser,
  searchQuery,
  setSearchQuery,
  lang,
  t,
  handleReprintReceipt,
  refreshAll,
  productCategories,
}) => {
  const [salesSubView, setSalesSubView] = useState<'pos' | 'history'>('pos');
  const [typeFilter, setTypeFilter] = useState('Phone');
  const categoryLabel = (type: string) => {
    const key = `type_${type.toLowerCase().replace(/\s+/g, '')}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState('All');
  const [scannerOpen, setScannerOpen] = useState(false);
  const cartPanelRef = useRef<HTMLDivElement | null>(null);

  // Checkout Modal State
  const [saleDiscountType, setSaleDiscountType] = useState<string>('none');
  const [saleDiscountValue, setSaleDiscountValue] = useState<number>(0);
  const [saleRemark, setSaleRemark] = useState<string>('');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');

  const displayImageUrl = (imageValue?: string) => {
    const value = String(imageValue || '').trim();
    if (!value) return '';
    if (/^[-\w]{20,}$/.test(value)) {
      return `https://drive.google.com/thumbnail?id=${value}&sz=w1200`;
    }
    const idMatch = value.match(/(?:id=|\/d\/)([-\w]{20,})/);
    return idMatch ? `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200` : value;
  };

  const brands = useMemo(() => {
    let items = inventory;
    if (gradeFilter !== 'All') {
      items = items.filter(p => (p.grade || '').toLowerCase() === gradeFilter.toLowerCase());
    }
    if (typeFilter !== 'All') {
      items = items.filter(p => {
        const type = (p.type || '').toLowerCase();
        if (typeFilter === 'Phone') return type === 'phone' || type === 'smartphone';
        return type === typeFilter.toLowerCase();
      });
    }
    const allBrands = items.map(item => item.brand).filter(b => b && b !== '-');
    return [...new Set(allBrands)].sort();
  }, [inventory, gradeFilter, typeFilter]);

  const filteredInventory = useMemo(() => {
    let items = inventory;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p => 
        String(p.model).toLowerCase().includes(q) || 
        String(p.brand).toLowerCase().includes(q) ||
        String(p.imei || p.id || '').toLowerCase().includes(q) ||
        String(p.barcode || '').toLowerCase().includes(q) ||
        String(p.specification).toLowerCase().includes(q)
      );
    } else {
      if (selectedBrand) {
        items = items.filter(p => p.brand === selectedBrand);
      }
      if (gradeFilter !== 'All') {
        items = items.filter(p => (p.grade || '').toLowerCase() === gradeFilter.toLowerCase());
      }
      if (typeFilter !== 'All') {
        items = items.filter(p => {
          const type = (p.type || '').toLowerCase();
          if (typeFilter === 'Phone') return type === 'phone' || type === 'smartphone';
          return type === typeFilter.toLowerCase();
        });
      }
    }
    return items;
  }, [inventory, searchQuery, selectedBrand, gradeFilter, typeFilter]);

  const cartQuantityByProductId = useMemo(() => {
    const quantities = new Map<string, number>();
    posCart.forEach(item => {
      const key = String(item.id || '');
      quantities.set(key, (quantities.get(key) || 0) + Math.max(1, Number(item.quantity) || 1));
    });
    return quantities;
  }, [posCart]);

  const cartItemCount = useMemo(
    () => posCart.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0),
    [posCart]
  );

  const decreaseProductQuantity = (product: InventoryItem) => {
    const productId = String(product.id || product.productid || 'WALK-IN');
    setPosCart(prev => {
      const existing = prev.find(item => String(item.id) === productId);
      if (!existing) return prev;
      const quantity = Math.max(1, Number(existing.quantity) || 1);
      if (quantity <= 1) return prev.filter(item => String(item.id) !== productId);
      return prev.map(item => String(item.id) === productId ? { ...item, quantity: quantity - 1 } : item);
    });
  };

  const openCartPanel = () => {
    cartPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Barcode values coming from Google Sheets can be numbers, text, contain spaces,
  // hyphens, or lose leading zeroes. Compare several safe normalized forms.
  const barcodeForms = (value: unknown): string[] => {
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw || raw === '-') return [];

    const compact = raw.replace(/[^a-z0-9]/g, '');
    const forms = new Set<string>([raw, compact]);

    if (/^\d+$/.test(compact)) {
      const withoutLeadingZeroes = compact.replace(/^0+(?=\d)/, '');
      forms.add(withoutLeadingZeroes);
    }

    return Array.from(forms).filter(Boolean);
  };

  const findInventoryByScannedCode = (scannedValue: string): InventoryItem | undefined => {
    const scannedForms = new Set(barcodeForms(scannedValue));
    if (scannedForms.size === 0) return undefined;

    return inventory.find(product => {
      const possibleValues = [
        product.barcode,
        product.imei,
        (product as any).imeisn,
        product.id,
        product.productid,
      ];

      return possibleValues.some(value =>
        barcodeForms(value).some(form => scannedForms.has(form))
      );
    });
  };

  const originalTotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + (Number(item.price || 0) * Math.max(1, Number(item.quantity) || 1)), 0);
  }, [posCart]);

  const finalTotal = useMemo(() => {
    return posCart.reduce((sum, item) => {
      const orig = Number(item.price) || 0;
      const dtype = item.discountType || 'none';
      const dval = Number(item.discountValue) || 0;
      const qty = Math.max(1, Number(item.quantity) || 1);
      if (dtype === 'foc') return sum;
      if (dtype === 'percent') return sum + ((orig - Math.round((orig * dval) / 100)) * qty);
      if (dtype === 'amount') return sum + (Math.max(0, orig - dval) * qty);
      return sum + (orig * qty);
    }, 0);
  }, [posCart]);

  const filteredSalesHistory = useMemo(() => {
    if (!searchQuery) return salesHistory || [];
    const q = searchQuery.toLowerCase();
    return (salesHistory || []).filter(s => 
      String(s.voucherno).toLowerCase().includes(q) ||
      String(s.type).toLowerCase().includes(q) ||
      String(s.customer).toLowerCase().includes(q) ||
      String(s.phone).toLowerCase().includes(q) ||
      String(s.imei).toLowerCase().includes(q)
    );
  }, [salesHistory, searchQuery]);

  return (
    <div className="flex flex-col lg:flex-row min-h-full lg:h-full lg:overflow-hidden w-full gap-4 lg:gap-6 pb-6 lg:pb-12">
      <div className="flex-1 min-w-0 flex flex-col lg:h-full lg:overflow-hidden">
        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-fit mb-4 lg:mb-6 shrink-0 overflow-x-auto">
          <button 
            onClick={() => setSalesSubView('pos')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              salesSubView === 'pos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <ShoppingCart size={15} />
            <span>{lang === 'mm' ? 'အရောင်းကောင်တာ (POS)' : 'POS Terminal'}</span>
          </button>
          <button 
            onClick={() => {
              setSalesSubView('history');
              refreshAll();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              salesSubView === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Receipt size={15} />
            <span>{lang === 'mm' ? 'အရောင်းမှတ်တမ်း' : 'Sales History'}</span>
          </button>
        </div>

        {/* POS Sub-view */}
        {salesSubView === 'pos' ? (
          <div className="flex-1 flex flex-col lg:overflow-hidden">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4 shrink-0 mb-4">
              <div className="flex items-center gap-3 flex-wrap min-w-0 w-full sm:w-auto">
                {selectedBrand && !searchQuery && (
                  <button 
                    onClick={() => setSelectedBrand(null)} 
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    ← All Brands
                  </button>
                )}
                <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight mr-2">
                  {selectedBrand || t('salesTerminal')}
                </h2>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto max-w-full">
                  {productCategories.map(type => (
                    <button 
                      key={type}
                      onClick={() => {
                        setTypeFilter(type);
                        setSelectedBrand(null);
                        setGradeFilter('All');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        typeFilter === type ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      {categoryLabel(type)}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setScannerOpen(true)} className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20">
                <ScanLine size={17} /> SCAN ITEM
              </button>
            </div>

            {/* Product Selection Cards */}
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar lg:pr-2">
              {filteredInventory && filteredInventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
                  {filteredInventory.map((p, i) => {
                    const productId = String(p.id || p.productid || 'WALK-IN');
                    const selectedQuantity = cartQuantityByProductId.get(productId) || 0;
                    const stock = Number(p.stock) || 0;
                    return (
                    <div
                      key={`${productId}-${i}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleAddToPosCart(p)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleAddToPosCart(p);
                        }
                      }}
                      className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl text-left transition-all shadow-xs group relative overflow-hidden cursor-pointer select-none ${selectedQuantity > 0 ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-blue-600'}`}
                    >
                      {(p.imageid || p.imageId || p.imageurl || p.imageUrl) && <img src={displayImageUrl(p.imageid || p.imageId || p.imageurl || p.imageUrl)} alt={p.model} className="w-full h-28 object-cover rounded-xl mb-3 bg-slate-100" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                      {selectedQuantity > 0 && (
                        <>
                          <div className="absolute inset-0 bg-emerald-950/10 pointer-events-none" />
                          <div className="absolute top-2 right-2 z-10 min-w-8 h-8 px-2 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black shadow-lg border-2 border-white dark:border-slate-900">
                            {selectedQuantity}
                          </div>
                          <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-between rounded-2xl bg-slate-950/90 p-2 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                            <button type="button" onClick={() => decreaseProductQuantity(p)} className="w-9 h-9 rounded-xl bg-white/15 text-white text-xl font-black hover:bg-white/25">−</button>
                            <div className="text-center text-white">
                              <div className="text-[9px] font-black uppercase tracking-widest opacity-70">Selected</div>
                              <div className="text-base font-black">{selectedQuantity}</div>
                            </div>
                            <button type="button" disabled={selectedQuantity >= stock} onClick={() => handleAddToPosCart(p)} className="w-9 h-9 rounded-xl bg-emerald-500 disabled:bg-slate-600 text-white text-xl font-black">+</button>
                          </div>
                        </>
                      )}
                      <div className={`relative z-10 ${selectedQuantity > 0 ? 'pb-14' : ''}`}>
                        <div className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1 flex items-center justify-between">
                          <span>{p.model}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${p.grade === 'Used' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {p.grade === 'Used' ? 'Used' : 'New'}
                          </span>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.brand}</div>
                        {p.specification && p.specification !== '-' && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2 italic opacity-80">{p.specification}</div>
                        )}
                        <div className="flex items-end justify-between gap-2">
                          <div className="text-blue-600 dark:text-blue-400 font-black text-base tracking-tight">
                            {(Number(p.sellingprice || p.price) || 0).toLocaleString()} <span className="text-[10px] opacity-60">MMK</span>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>STOCK {stock}</span>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 uppercase font-black text-xs">
                  {t('warehouseEmpty')}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Sales History Log Table */
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {lang === 'mm' ? 'အရောင်းမှတ်တမ်းများ' : 'Sales History Log'} ({filteredSalesHistory.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSalesHistory.length > 0 ? (
                  filteredSalesHistory.map((sale, i) => (
                    <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
                          <ShoppingCart size={18} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-800 dark:text-white uppercase">
                              {sale.type}
                            </span>
                            {sale.voucherno && (
                              <span className="px-2 py-0.5 text-[9px] bg-blue-600 text-white rounded font-black uppercase">
                                {sale.voucherno}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                            <span>Customer: <strong className="text-slate-700 dark:text-slate-200">{sale.customer}</strong></span>
                            {sale.phone && <span>• {sale.phone}</span>}
                            <span>• {formatUSDateTime(sale.timestamp)}</span>
                          </div>
                          {sale.remark && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold italic">
                              Note: {sale.remark}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="text-right">
                          <div className="font-black text-base text-emerald-600 dark:text-emerald-400">
                            {(Number(sale.price) || 0).toLocaleString()} <span className="text-[10px]">MMK</span>
                          </div>
                          {currentUser?.role === 'Admin' && (
                            <div className="text-[10px] font-bold text-blue-500">
                              Profit: {(Number(sale.profit) || 0).toLocaleString()} MMK
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleReprintReceipt('Official Voucher', sale)}
                          className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold uppercase"
                        >
                          <Printer size={14} />
                          <span>Voucher</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-slate-400 italic text-xs">
                    {lang === 'mm' ? 'အရောင်းမှတ်တမ်း မတွေ့ရှိပါ။' : 'No sales logs found.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar Panel (Visible in POS mode) */}
      {salesSubView === 'pos' && (
        <div ref={cartPanelRef} className="w-full lg:w-[380px] shrink-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm h-full max-h-[calc(100vh-140px)] sticky top-4">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShoppingCart size={16} />
              </div>
              <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {lang === 'mm' ? 'ခြင်းတောင်း' : 'Cart'} ({posCart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)})
              </span>
            </div>
            {posCart.length > 0 && (
              <button 
                onClick={() => setPosCart([])} 
                className="text-[10px] uppercase font-black text-red-500 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {posCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-slate-300 dark:text-slate-700 text-center">
                <ShoppingCart size={40} className="mb-2 opacity-30" />
                <div className="text-xs font-black uppercase tracking-widest">{lang === 'mm' ? 'ခြင်းတောင်းအလွတ်ဖြစ်သည်' : 'Cart Empty'}</div>
                <div className="text-[10px] mt-1 text-slate-400 font-sans">{lang === 'mm' ? 'ပစ္စည်းများကို နှိပ်ပြီး ထည့်ပါ' : 'Select items to add'}</div>
              </div>
            ) : (
              posCart.map((item) => (
                <div key={item.cartItemId} className="p-3.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 font-sans">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2">
                      {item.imageid || item.imageId || item.imageurl || item.imageUrl ? (
                        <img src={displayImageUrl(item.imageid || item.imageId || item.imageurl || item.imageUrl)} alt={item.model} className="w-11 h-11 object-cover rounded-lg bg-slate-100 shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : null}
                      <div>
                      <div className="font-extrabold text-xs text-slate-800 dark:text-white uppercase leading-snug">{item.model}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">{item.brand}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPosCart(prev => prev.filter(c => c.cartItemId !== item.cartItemId))}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[9px] font-black uppercase text-slate-400">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPosCart(prev => prev.map(c => c.cartItemId === item.cartItemId ? { ...c, quantity: Math.max(1, (Number(c.quantity) || 1) - 1) } : c))} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 font-black">−</button>
                      <input type="number" min="1" max={item.stock} value={item.quantity || 1} onChange={(e) => { const qty = Math.max(1, Math.min(Number(item.stock) || 1, Number(e.target.value) || 1)); setPosCart(prev => prev.map(c => c.cartItemId === item.cartItemId ? { ...c, quantity: qty } : c)); }} className="w-14 h-8 text-center rounded-lg bg-slate-100 dark:bg-slate-700 font-black outline-none" />
                      <button type="button" onClick={() => setPosCart(prev => prev.map(c => c.cartItemId === item.cartItemId ? { ...c, quantity: Math.min(Number(c.stock) || 1, (Number(c.quantity) || 1) + 1) } : c))} className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black">+</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[8.5px] font-black text-slate-400 uppercase mb-1">Unit Price (MMK)</label>
                      <input 
                        type="number" 
                        value={item.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPosCart(prev => prev.map(c => c.cartItemId === item.cartItemId ? { ...c, price: val } : c));
                        }}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 rounded-lg outline-none border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-black text-slate-400 uppercase mb-1">IMEI / SN</label>
                      <input 
                        type="text" 
                        value={item.imei}
                        placeholder="IMEI"
                        onChange={(e) => {
                          const val = e.target.value;
                          setPosCart(prev => prev.map(c => c.cartItemId === item.cartItemId ? { ...c, imei: val } : c));
                        }}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 rounded-lg outline-none border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[8.5px] font-black text-slate-400 uppercase mb-1">Warranty</label>
                      <select 
                        value={item.warranty}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPosCart(prev => prev.map(c => c.cartItemId === item.cartItemId ? { ...c, warranty: val } : c));
                        }}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 rounded-lg outline-none border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                      >
                        <option value="No Warranty">No Warranty</option>
                        <option value="1 Month">1 Month</option>
                        <option value="3 Months">3 Months</option>
                        <option value="6 Months">6 Months</option>
                        <option value="1 Year">1 Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8.5px] font-black text-slate-400 uppercase mb-1">Discount / Gift</label>
                      <select
                        value={item.discountType || 'none'}
                        onChange={(e) => {
                          const type = e.target.value as any;
                          setPosCart(prev => prev.map(c => c.cartItemId === item.cartItemId ? { ...c, discountType: type, discountValue: 0 } : c));
                        }}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 rounded-lg outline-none border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                      >
                        <option value="none">No Discount</option>
                        <option value="percent">Discount %</option>
                        <option value="amount">Discount MMK</option>
                        <option value="foc">Gift / FOC (Free)</option>
                      </select>
                    </div>
                  </div>

                  {(item.discountType === 'percent' || item.discountType === 'amount') && (
                    <div>
                      <label className="block text-[8.5px] font-black text-blue-600 uppercase mb-1">
                        {item.discountType === 'percent' ? 'Enter Discount Percent (%)' : 'Enter Discount Amount (MMK)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={item.discountType === 'percent' ? 100 : undefined}
                        value={item.discountValue || ''}
                        onChange={(e) => {
                          const value = Math.max(0, Number(e.target.value) || 0);
                          setPosCart(prev => prev.map(c => c.cartItemId === item.cartItemId ? { ...c, discountValue: value } : c));
                        }}
                        placeholder={item.discountType === 'percent' ? 'Example: 5' : 'Example: 50000'}
                        className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl outline-none border border-blue-200 dark:border-blue-900 font-black text-blue-700 dark:text-blue-300 text-xs"
                      />
                    </div>
                  )}

                  {item.discountType === 'foc' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-[10px] font-black uppercase">
                      <Gift size={14}/> Gift item: price is 0 MMK and stock will still decrease by 1.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {posCart.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-400">{lang === 'mm' ? 'စုစုပေါင်း ကျသင့်ငွေ' : 'Total Amount'}</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {finalTotal.toLocaleString()} <span className="text-xs">MMK</span>
                </span>
              </div>
              <button 
                onClick={() => {
                  setSelectedProduct(posCart[0]);
                  setCashReceived(finalTotal);
                  setPaymentMethod('Cash');
                  setShowSaleModal(true);
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-xs active:scale-95 transition-all"
              >
                <CheckCircle size={16} />
                <span>{lang === 'mm' ? 'ငွေရှင်းဘောက်ချာထုတ်မည်' : 'Checkout & Print'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {salesSubView === 'pos' && cartItemCount > 0 && (
        <button
          type="button"
          onClick={openCartPanel}
          className="fixed z-40 bottom-5 left-1/2 -translate-x-1/2 lg:left-auto lg:right-8 lg:translate-x-0 flex items-center gap-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 shadow-2xl border-4 border-white dark:border-slate-950 active:scale-95 transition-all"
          aria-label="Open cart"
        >
          <div className="relative w-11 h-11 rounded-full bg-white text-emerald-500 flex items-center justify-center">
            <ShoppingCart size={23} />
            <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">{cartItemCount}</span>
          </div>
          <div className="text-left leading-tight">
            <div className="text-sm font-black">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</div>
            <div className="text-xl font-black tracking-tight">{finalTotal.toLocaleString()} MMK</div>
          </div>
        </button>
      )}

      {/* Checkout Modal */}
      {showSaleModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('checkoutTitle')}</h3>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveSale} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('customer')}</label>
                  <input name="customerName" required defaultValue="Walk-in" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('phone')}</label>
                  <input name="phone" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" placeholder="09xxxxxxx" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('payment')}</label>
                  <select name="payment" value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); if (e.target.value !== 'Cash') setCashReceived(finalTotal); }} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200">
                    <option value="Cash">Cash (ငွေသား)</option>
                    <option value="KPay">KPay</option>
                    <option value="WaveMoney">WaveMoney</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">{t('channel')}</label>
                  <select name="channel" className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200">
                    <option value="Walk-in">{t('walkin')}</option>
                    <option value="Facebook">{t('facebook')}</option>
                    <option value="TikTok">{t('tiktok')}</option>
                    <option value="Telegram">{t('telegram')}</option>
                  </select>
                </div>
              </div>

              {paymentMethod === 'Cash' && (
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase mb-1.5">Cash Received</label>
                      <input name="cashReceived" type="number" min={finalTotal} value={cashReceived || ''} onChange={(e) => setCashReceived(Math.max(0, Number(e.target.value) || 0))} className="w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-base font-black outline-none border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-white" placeholder="100000" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Change</label>
                      <div className={`w-full px-4 py-3 rounded-xl text-base font-black ${cashReceived >= finalTotal ? 'bg-blue-600 text-white' : 'bg-red-100 text-red-600'}`}>
                        {Math.max(0, cashReceived - finalTotal).toLocaleString()} MMK
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'EXACT', value: finalTotal },
                      { label: '+1K', value: finalTotal + 1000 },
                      { label: '+5K', value: finalTotal + 5000 },
                      { label: '+10K', value: finalTotal + 10000 },
                      { label: '+20K', value: finalTotal + 20000 },
                      { label: '+50K', value: finalTotal + 50000 },
                      { label: '100K', value: 100000 },
                      { label: '200K', value: 200000 },
                    ].map(option => (
                      <button key={option.label} type="button" onClick={() => setCashReceived(option.value)} className="py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black text-emerald-700 dark:text-emerald-300">{option.label}</button>
                    ))}
                  </div>
                  {cashReceived < finalTotal && <div className="text-[10px] font-black text-red-600 uppercase">Not enough cash: {(finalTotal - cashReceived).toLocaleString()} MMK remaining</div>}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Remark / Memo</label>
                <input 
                  type="text"
                  name="remark"
                  value={saleRemark}
                  onChange={(e) => setSaleRemark(e.target.value)}
                  placeholder="Gift 20W charger, screen protector..."
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span>{originalTotal.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between text-sm font-black text-blue-600 dark:text-blue-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Final Total</span>
                  <span>{finalTotal.toLocaleString()} MMK</span>
                </div>
              </div>

              <button 
                disabled={isSaving || (paymentMethod === 'Cash' && cashReceived < finalTotal)} 
                type="submit" 
                className="w-full py-4 bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all"
              >
                {isSaving ? t('saving') : <React.Fragment><CheckCircle size={16} /> Confirm & Print Voucher</React.Fragment>}
              </button>
            </form>
          </div>
        </div>
      )}
      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(value) => {
          const product = findInventoryByScannedCode(value);

          if (!product) {
            setSearchQuery(value.trim());
            alert(`Barcode not found in Inventory: ${value}\n\nPlease check that this exact code is saved in the Barcode or IMEI column.`);
            return;
          }

          setSalesSubView('pos');
          setSearchQuery('');
          handleAddToPosCart(product);

          // Wait for React to update the cart, then take the user directly to it.
          window.setTimeout(() => openCartPanel(), 180);
        }}
        title="Scan Item for POS"
      />
    </div>
  );
};
