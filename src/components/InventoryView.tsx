import React, { useState, useMemo, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Tag, 
  ChevronRight, 
  Smartphone, 
  Search, 
  X, 
  Save, 
  CheckCircle,
  PackageSearch,
  ScanLine,
  Image as ImageIcon,
  Camera,
  Upload,
  ShoppingCart
} from 'lucide-react';
import { InventoryItem, CartItem } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { callRpc } from '../api';

interface InventoryViewProps {
  inventory: InventoryItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showInventoryModal: boolean;
  setShowInventoryModal: (show: boolean) => void;
  handleSaveInventory: (e: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  lang: string;
  t: (key: string) => string;
  handleAddToPosCart?: (product: InventoryItem) => void;
  setActiveView?: (view: string) => void;
  posCart?: CartItem[];
  setPosCart?: React.Dispatch<React.SetStateAction<CartItem[]>>;
  productCategories: string[];
  accessoryCategories: string[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  searchQuery,
  setSearchQuery,
  showInventoryModal,
  setShowInventoryModal,
  handleSaveInventory,
  isSaving,
  lang,
  t,
  handleAddToPosCart,
  setActiveView,
  posCart = [],
  setPosCart,
  productCategories,
  accessoryCategories,
}) => {
  const [typeFilter, setTypeFilter] = useState('Phone');
  const categoryLabel = (type: string) => {
    const key = `type_${type.toLowerCase().replace(/\s+/g, '')}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const cartQuantityByProductId = useMemo(() => {
    const quantities = new Map<string, number>();
    posCart.forEach((cartItem) => {
      const key = String(cartItem.id || '');
      quantities.set(key, (quantities.get(key) || 0) + Math.max(1, Number(cartItem.quantity) || 1));
    });
    return quantities;
  }, [posCart]);

  const cartItemCount = useMemo(
    () => posCart.reduce((sum, cartItem) => sum + Math.max(1, Number(cartItem.quantity) || 1), 0),
    [posCart]
  );

  const cartTotal = useMemo(() => posCart.reduce((sum, cartItem) => {
    const qty = Math.max(1, Number(cartItem.quantity) || 1);
    const price = Number(cartItem.price) || 0;
    const discountType = cartItem.discountType || 'none';
    const discountValue = Number(cartItem.discountValue) || 0;
    if (discountType === 'foc') return sum;
    if (discountType === 'percent') return sum + Math.max(0, price - Math.round(price * discountValue / 100)) * qty;
    if (discountType === 'amount') return sum + Math.max(0, price - discountValue) * qty;
    return sum + price * qty;
  }, 0), [posCart]);

  const decreaseCartQuantity = (item: InventoryItem) => {
    if (!setPosCart) return;
    const productId = String(item.id || item.productid || 'WALK-IN');
    setPosCart((previous) => {
      const existing = previous.find((cartItem) => String(cartItem.id) === productId);
      if (!existing) return previous;
      const quantity = Math.max(1, Number(existing.quantity) || 1);
      if (quantity <= 1) return previous.filter((cartItem) => String(cartItem.id) !== productId);
      return previous.map((cartItem) => String(cartItem.id) === productId
        ? { ...cartItem, quantity: quantity - 1 }
        : cartItem);
    });
  };
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState('All');

  // Modal form states
  const [addCategory, setAddCategory] = useState('Phone');
  const [addCondition, setAddCondition] = useState('New');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [addBrand, setAddBrand] = useState('');
  const [addModel, setAddModel] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const displayImageUrl = (imageValue?: string) => {
    const value = String(imageValue || '').trim();
    if (!value) return '';
    if (/^[-\w]{20,}$/.test(value)) {
      return `https://drive.google.com/thumbnail?id=${value}&sz=w1200`;
    }
    const idMatch = value.match(/(?:id=|\/d\/)([-\w]{20,})/);
    return idMatch ? `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200` : value;
  };

  const makePhotoFileName = (originalName?: string) => {
    const ext = (originalName && originalName.includes('.')) ? originalName.split('.').pop() : 'jpg';
    const base = (photoName || `${addBrand} ${addModel}` || 'KSM-POS-Product')
      .trim()
      .replace(/[^a-zA-Z0-9က-အ _-]/g, '')
      .replace(/\s+/g, '-');
    return `${base || 'KSM-POS-Product'}-${Date.now()}.${ext || 'jpg'}`;
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }
    if (file.size > 12 * 1024 * 1024) { alert('Image is too large. Please use an image below 12 MB.'); return; }
    setIsUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Cannot read the image.'));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error('Cannot open the image.'));
          img.onload = () => {
            const max = 1200;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Image processing is unavailable.'));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      });
      const result = await callRpc('uploadProductImage', {
        dataUrl,
        fileName: makePhotoFileName(file.name)
      });
      if (!result || result.status === 'error' || !result.fileId) throw new Error(result?.message || 'Image upload failed.');
      setImageUrl(result.fileId);
    } catch (error: any) {
      alert(error?.message || String(error));
    } finally {
      setIsUploadingImage(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
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
        String(p.imei || p.productid || '').toLowerCase().includes(q) ||
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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {selectedBrand && !searchQuery && (
            <button 
              onClick={() => setSelectedBrand(null)} 
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              ← {lang === 'mm' ? 'အမှတ်တံဆိပ်များသို့' : 'All Brands'}
            </button>
          )}

          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mr-2">
            {selectedBrand || t('inventory')}
          </h2>

          {/* Category Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex-wrap gap-1">
            {productCategories.map(type => (
              <button 
                key={type}
                onClick={() => {
                  setTypeFilter(type);
                  setSelectedBrand(null);
                  setGradeFilter('All');
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                  typeFilter === type ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'
                }`}
              >
                {categoryLabel(type)}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setShowInventoryModal(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>{t('addItem')}</span>
        </button>
      </div>

      {/* Main Inventory Display */}
      <div className="pt-2">
        {!selectedBrand && !searchQuery ? (
          typeFilter === 'Phone' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Brand New Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('brandNew')}</h3>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black">
                    {inventory.filter(p => {
                      const type = (p.type || '').toLowerCase();
                      const grade = (p.grade || '').toLowerCase();
                      return (type === 'phone' || type === 'smartphone') && (grade === 'new' || grade === 'brand new');
                    }).reduce((sum, p) => sum + (Number(p.stock) || 0), 0)} units
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(() => {
                    const phoneItems = inventory.filter(p => {
                      const type = (p.type || '').toLowerCase();
                      const grade = (p.grade || '').toLowerCase();
                      return (type === 'phone' || type === 'smartphone') && (grade === 'new' || grade === 'brand new');
                    });
                    const brandList = [...new Set(phoneItems.map(p => p.brand))].sort();
                    if (brandList.length === 0) {
                      return <div className="py-12 text-center text-slate-400 text-xs uppercase font-bold tracking-widest">{t('warehouseEmpty')}</div>;
                    }
                    return brandList.map(brand => (
                      <button 
                        key={`new-${brand}`}
                        onClick={() => { setGradeFilter('New'); setSelectedBrand(brand); }}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-600 transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                            <Tag size={18} />
                          </div>
                          <div className="text-left">
                            <div className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight leading-tight">{brand}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {phoneItems.filter(p => p.brand === brand).length} variants
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Units</div>
                            <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                              {phoneItems.filter(p => p.brand === brand).reduce((sum, p) => sum + (Number(p.stock) || 0), 0)}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* Used Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('used')}</h3>
                  </div>
                  <span className="px-3 py-1 bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black">
                    {inventory.filter(p => {
                      const type = (p.type || '').toLowerCase();
                      const grade = (p.grade || '').toLowerCase();
                      return (type === 'phone' || type === 'smartphone') && grade === 'used';
                    }).reduce((sum, p) => sum + (Number(p.stock) || 0), 0)} units
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(() => {
                    const phoneItems = inventory.filter(p => {
                      const type = (p.type || '').toLowerCase();
                      const grade = (p.grade || '').toLowerCase();
                      return (type === 'phone' || type === 'smartphone') && grade === 'used';
                    });
                    const brandList = [...new Set(phoneItems.map(p => p.brand))].sort();
                    if (brandList.length === 0) {
                      return <div className="py-12 text-center text-slate-400 text-xs uppercase font-bold tracking-widest">{t('warehouseEmpty')}</div>;
                    }
                    return brandList.map(brand => (
                      <button 
                        key={`used-${brand}`}
                        onClick={() => { setGradeFilter('Used'); setSelectedBrand(brand); }}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-xs">
                            <Tag size={18} />
                          </div>
                          <div className="text-left">
                            <div className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight leading-tight">{brand}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {phoneItems.filter(p => p.brand === brand).length} variants
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Units</div>
                            <div className="text-lg font-black text-orange-500">
                              {phoneItems.filter(p => p.brand === brand).reduce((sum, p) => sum + (Number(p.stock) || 0), 0)}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-3">
              {brands.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">{t('warehouseEmpty')}</div>
              ) : (
                brands.map((brand, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setGradeFilter('All'); setSelectedBrand(brand); }}
                    className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-blue-600 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Tag size={22} />
                      </div>
                      <div className="text-left">
                        <div className="font-black text-slate-800 dark:text-white text-lg uppercase tracking-tight leading-tight">{brand}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                          {inventory.filter(p => p.brand === brand).length} Models available
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Stock Count</div>
                        <div className="text-xl font-black text-slate-800 dark:text-white">
                          {inventory.filter(p => p.brand === brand).reduce((sum, p) => sum + (Number(p.stock) || 0), 0)}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )
        ) : filteredInventory && filteredInventory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredInventory.map((item, i) => {
              const productId = String(item.id || item.productid || 'WALK-IN');
              const selectedQuantity = cartQuantityByProductId.get(productId) || 0;
              const stock = Math.max(0, Number(item.stock) || 0);
              return (
              <div 
                key={`${productId}-${i}`}
                role={handleAddToPosCart ? 'button' : undefined}
                tabIndex={handleAddToPosCart ? 0 : undefined}
                onClick={() => handleAddToPosCart?.(item)}
                onKeyDown={(event) => {
                  if (!handleAddToPosCart) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleAddToPosCart(item);
                  }
                }}
                className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm relative overflow-hidden group hover:shadow-xl transition-all flex flex-col justify-between select-none ${handleAddToPosCart ? 'cursor-pointer' : ''} ${selectedQuantity > 0 ? 'border-emerald-500 ring-2 ring-emerald-500/25' : 'border-slate-200 dark:border-slate-800'}`}
              >
                {selectedQuantity > 0 && (
                  <>
                    <div className="absolute inset-0 z-10 bg-emerald-950/15 pointer-events-none" />
                    <div className="absolute top-3 left-3 z-30 min-w-9 h-9 px-2 rounded-full bg-emerald-500 text-white border-2 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-sm font-black">
                      {selectedQuantity}
                    </div>
                    <div
                      className="absolute inset-x-4 bottom-4 z-30 flex items-center justify-between gap-3 rounded-2xl bg-slate-950/92 px-3 py-2.5 shadow-2xl"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button type="button" onClick={() => decreaseCartQuantity(item)} className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xl font-black">−</button>
                      <div className="text-center text-white">
                        <div className="text-[9px] uppercase tracking-widest font-black opacity-65">Selected</div>
                        <div className="text-lg font-black">{selectedQuantity}</div>
                      </div>
                      <button type="button" disabled={selectedQuantity >= stock} onClick={() => handleAddToPosCart?.(item)} className="w-10 h-10 rounded-xl bg-emerald-500 disabled:bg-slate-600 text-white text-xl font-black">+</button>
                    </div>
                  </>
                )}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    item.stock < 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}>
                    {item.stock} in stock
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                    item.grade === 'Used' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.grade || 'New'}
                  </span>
                </div>

                <div>
                  {(item.imageid || item.imageId || item.imageurl || item.imageUrl) ? (
                    <img
                      src={displayImageUrl(item.imageid || item.imageId || item.imageurl || item.imageUrl)}
                      alt={`${item.brand} ${item.model}`}
                      className="w-full h-44 object-cover rounded-2xl mb-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-32 rounded-2xl mb-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <ImageIcon size={34} />
                    </div>
                  )}
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.brand}</div>
                  <div className="text-xl font-black text-slate-800 dark:text-white mb-2 leading-snug uppercase tracking-tight line-clamp-2">{item.model}</div>
                  
                  {item.specification && item.specification !== '-' && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 italic line-clamp-2 leading-relaxed">
                      {item.specification}
                    </div>
                  )}

                  {item.imei && item.imei !== '-' && (
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
                      IMEI: {item.imei}
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Selling Price</div>
                    <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                      {(Number(item.price || item.sellingprice) || 0).toLocaleString()} <span className="text-[10px] font-bold opacity-60">MMK</span>
                    </div>
                  </div>

                  {handleAddToPosCart && selectedQuantity === 0 && (
                    <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-sm">
                      <Plus size={20} />
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <PackageSearch size={56} className="mb-3 opacity-30" />
            <div className="font-black text-xs uppercase tracking-widest opacity-50">{t('warehouseEmpty')}</div>
          </div>
        )}
      </div>

      {/* Add Inventory Modal */}
      {cartItemCount > 0 && setActiveView && (
        <button
          type="button"
          onClick={() => setActiveView('sales')}
          className="fixed z-40 bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 shadow-2xl border-4 border-white dark:border-slate-950 active:scale-95 transition-all"
          aria-label="Review selected items"
        >
          <div className="relative w-11 h-11 rounded-full bg-white text-emerald-500 flex items-center justify-center">
            <ShoppingCart size={23} />
            <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">{cartItemCount}</span>
          </div>
          <div className="text-left leading-tight">
            <div className="text-sm font-black">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</div>
            <div className="text-xl font-black tracking-tight">{cartTotal.toLocaleString()} MMK</div>
          </div>
        </button>
      )}

      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('addItem')}</h3>
              <button 
                onClick={() => {
                  setShowInventoryModal(false);
                  setAddCategory('Phone');
                  setAddCondition('New');
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveInventory} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('category')}</label>
                  <select 
                    name="type" 
                    value={addCategory} 
                    onChange={(e) => { setAddCategory(e.target.value); if (e.target.value !== 'Accessories') setAddModel(''); }} 
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {productCategories.map(category => (
                      <option key={category} value={category}>
                        {categoryLabel(category)}
                      </option>
                    ))}
                  </select>
                </div>

                {addCategory === 'Accessories' ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      {lang === 'mm' ? 'ဆက်စပ်ပစ္စည်း အမျိုးအစား' : 'Accessory Category'}
                    </label>
                    <select name="accessory_type" onChange={(e) => { if (!addModel) setAddModel(e.target.value); }} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer">
                      {accessoryCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang === 'mm' ? 'ပစ္စည်းအခြေအနေ' : 'Item Condition'}</label>
                    <select 
                      name="grade" 
                      value={addCondition} 
                      onChange={(e) => setAddCondition(e.target.value)} 
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="New">Brand New</option>
                      <option value="Used">Used / Second Hand</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Brand</label>
                  <input 
                    name="brand"
                    value={addBrand}
                    onChange={(e) => setAddBrand(e.target.value)}
                    required 
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                    placeholder={addCategory === 'Phone' ? "e.g. Apple" : "e.g. Anker"} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Model Name</label>
                  <input 
                    name="model"
                    value={addModel}
                    onChange={(e) => setAddModel(e.target.value)}
                    required 
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                    placeholder={addCategory === 'Phone' ? "e.g. iPhone 16 Pro" : "20W Charger"} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('costPrice')}</label>
                  <input 
                    name="costPrice" 
                    type="number" 
                    required 
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none text-slate-800 dark:text-slate-200" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('price')}</label>
                  <input 
                    name="price" 
                    type="number" 
                    required 
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none text-blue-600 dark:text-blue-400" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('stock')}</label>
                  <input 
                    name="stock" 
                    type="number" 
                    required 
                    defaultValue={1}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {addCategory === 'Phone' ? 'IMEI / Serial No' : 'Barcode / Serial (Optional)'}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      name="imei" 
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                      placeholder="Enter or scan IMEI / Serial" 
                    />
                    <button type="button" onClick={() => setScannerOpen(true)} className="px-3 rounded-xl bg-blue-600 text-white" title="Scan"><ScanLine size={18} /></button>
                  </div>
                </div>
              </div>

              {addCategory === 'Phone' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang === 'mm' ? 'အရောင်' : 'Color'}</label>
                    <input 
                      name="color" 
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                      placeholder="Gold, Titanium, Black" 
                    />
                  </div>
                  {addCondition === 'Used' ? (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{lang === 'mm' ? 'ဘက်ထရီ %' : 'Battery %'}</label>
                      <input 
                        name="battery" 
                        type="number" 
                        min="0" 
                        max="100" 
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                        placeholder="85" 
                      />
                    </div>
                  ) : <div />}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Barcode / SKU</label>
                <input name="barcode" value={scannedCode} onChange={(e) => setScannedCode(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold outline-none" placeholder="Optional barcode or SKU" />
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1"><ImageIcon size={13}/> Product Photo</label>
                <div className="mb-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Photo name</label>
                  <input
                    type="text"
                    value={photoName}
                    onChange={(e) => setPhotoName(e.target.value)}
                    placeholder={(addBrand || addModel) ? `${addBrand} ${addModel}`.trim() : 'Example: REMAX 18W Charger'}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold outline-none border border-slate-200 dark:border-slate-700"
                  />
                  <div className="mt-1 text-[9px] text-slate-400">Leave empty to use Brand + Model automatically.</div>
                </div>
                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} />
                <input type="hidden" name="imageId" value={imageUrl} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isUploadingImage} onClick={() => galleryInputRef.current?.click()} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-2 disabled:opacity-50"><Upload size={15}/> {isUploadingImage ? 'Uploading...' : 'Upload Photo'}</button>
                  <button type="button" disabled={isUploadingImage} onClick={() => cameraInputRef.current?.click()} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2 disabled:opacity-50"><Camera size={15}/> Take Photo</button>
                  {imageUrl && <button type="button" onClick={() => setImageUrl('')} className="px-3 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-black">Remove</button>}
                </div>
                <p className="mt-2 text-[10px] text-slate-400">The photo is compressed and saved to your Google Drive automatically.</p>
                {imageUrl && <img src={displayImageUrl(imageUrl)} alt="Preview" className="mt-3 w-28 h-28 object-cover rounded-2xl border border-slate-200" />}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('specification')}</label>
                <textarea 
                  name="specification" 
                  rows={2} 
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-200 resize-none" 
                  placeholder="256GB, Full Set Box, Original Charger..."
                />
              </div>

              <button 
                disabled={isSaving || isUploadingImage} 
                type="submit" 
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all"
              >
                {isSaving ? t('saving') : <React.Fragment><Save size={16} /> {t('addItem')}</React.Fragment>}
              </button>
            </form>
          </div>
        </div>
      )}
      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={(value) => setScannedCode(value)} title="Scan Inventory IMEI / Barcode" />
    </div>
  );
};
