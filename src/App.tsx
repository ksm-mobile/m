import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  InventoryItem, 
  CartItem, 
  SaleRecord, 
  RepairJob, 
  ExpenseRecord,
  PurchaseRecord, 
  FinancialReport, 
  ReceiptData, 
  RepairStatus 
} from './types';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { PosView } from './components/PosView';
import { RepairsView } from './components/RepairsView';
import { ExpensesView } from './components/ExpensesView';
import { PurchasesView } from './components/PurchasesView';
import { StaffView } from './components/StaffView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginModal } from './components/LoginModal';
import { GasGuideModal } from './components/GasGuideModal';
import { callRpc } from './api';

const translations: Record<string, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    repairs: 'Repair Jobs',
    sales: 'Sales/POS',
    expenses: 'Expenses',
    purchases: 'Purchases',
    settings: 'Settings',
    revenue: 'Revenue',
    salesRevenue: 'Sales Revenue',
    repairRevenue: 'Repair Revenue',
    totalRevenue: 'Total Revenue',
    expenditure: 'Expenditure',
    netProfit: 'Net Profit',
    totalProfit: 'Total Profit',
    activeItems: 'Active Items',
    topSellingItems: 'Best-Selling Items',
    topRepairDevices: 'Most Repaired Items',
    active: 'Active',
    newJob: 'New Repair Job',
    addItem: 'Add Inventory Item',
    logExpense: 'Log Expense',
    searchPlaceholder: 'Search Order ID, Name, Phone, Model, IMEI...',
    statusFilter: 'Status Filter',
    serviceWorkflow: 'Service Jobs Workflow',
    all: 'All',
    pending: 'Pending',
    repairing: 'Repairing',
    ready: 'Done',
    delivered: 'Delivered',
    reject: 'Reject',
    customer: 'Customer',
    phone: 'Phone Number',
    device: 'Device Model',
    issue: 'Reported Issue',
    imeiSn: 'IMEI / Serial No',
    initialCondition: 'Initial Condition',
    total: 'Total Amount',
    payment: 'Payment Method',
    save: 'Save',
    saving: 'Saving...',
    receipt: 'Voucher',
    print: 'Print',
    reprint: 'Reprint',
    stock: 'Stock Count',
    price: 'Selling Price',
    costPrice: 'Cost Price',
    category: 'Category',
    description: 'Description',
    quickAdd: 'Quick Add',
    entries: 'Recent Entries',
    scanSearch: 'Scan or Search Product...',
    warehouseEmpty: 'No Items Found',
    salesTerminal: 'POS Sales Terminal',
    finalize: 'Finalize Checkout',
    dbSetup: 'Google Sheets Setup',
    initializeDb: 'Initialize All Sheets',
    appVersion: 'App Version',
    theme: 'Theme Mode',
    language: 'Language',
    exportData: 'Backup / Export CSV',
    startDate: 'Start Date',
    endDate: 'End Date',
    selectSheet: 'Select Sheet',
    btnExport: 'Export to CSV',
    allSheets: 'All Sheets (Full Archive)',
    channel: 'Sales Channel',
    walkin: 'Walk-in Customer',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    telegram: 'Telegram',
    warranty: 'Warranty Period',
    checkoutTitle: 'Complete POS Checkout',
    specification: 'Specification / Details',
    allGrades: 'All Grades',
    brandNew: 'Brand New',
    used: 'Used / Second Hand',
    type_phone: 'Phone',
    type_accessories: 'Accessories',
    type_computer: 'Computer',
    type_serviceparts: 'Service Parts',
    type_others: 'Others',
    voucherSettings: 'Voucher & Profile Settings',
    storeName: 'Store Name',
    storeTagline: 'Store Tagline / Subtitle',
    logoText: 'Logo Text (Max 4 chars)',
    footerText: 'Warranty / Footer Note',
    receiptSize: 'Receipt Paper Format',
    saveSettings: 'Save Settings',
    settingsSaved: 'Voucher Settings Updated Successfully!',
    enterPin: 'Enter Security PIN',
    invalidPin: 'Invalid security PIN! Please try again.',
    logout: 'Log Out',
    staffManagement: 'Staff Accounts & Security',
    staffList: 'Staff Profiles',
    addStaff: 'Add Staff Member',
    staffName: 'Staff Name / Username',
    staffEmail: 'Google Gmail Address',
    staffPin: 'Access PIN (4 Digits)',
    staffRole: 'System Permission Role',
    staffStatus: 'Account Status',
    onlyAdminSettings: 'Admin Access Required',
    costPricesHidden: 'Cost prices and margins locked for staff accounts',
  },
  mm: {
    dashboard: 'ပင်မစာမျက်နှာ',
    inventory: 'ပစ္စည်းစာရင်း',
    repairs: 'ပြုပြင်ရေး',
    sales: 'အရောင်းကောင်တာ',
    expenses: 'အသုံးစရိတ်',
    purchases: 'ဝယ်ယူမှု',
    settings: 'ဆက်တင်များ',
    revenue: 'စုစုပေါင်းရငွေ',
    salesRevenue: 'အရောင်း ရငွေ',
    repairRevenue: 'ပြုပြင်မှု ရငွေ',
    totalRevenue: 'စုစုပေါင်း ရငွေ',
    expenditure: 'စုစုပေါင်းအသုံးစရိတ်',
    netProfit: 'အသားတင်အမြတ်',
    totalProfit: 'စုစုပေါင်းအမြတ်',
    activeItems: 'လက်ရှိပစ္စည်းများ',
    topSellingItems: 'အရောင်းရဆုံး ပစ္စည်းစာရင်း',
    topRepairDevices: 'Repair အများဆုံး ပစ္စည်းစာရင်း',
    active: 'ဆောင်ရွက်ဆဲ',
    newJob: 'အသစ်သွင်းရန်',
    addItem: 'ပစ္စည်းအသစ်',
    logExpense: 'အသုံးစရိတ်မှတ်ရန်',
    searchPlaceholder: 'ရှာဖွေရန်...',
    statusFilter: 'အခြေအနေစစ်ထုတ်ရန်',
    serviceWorkflow: 'ဝန်ဆောင်မှုလုပ်ငန်းစဉ်',
    all: 'အားလုံး',
    pending: 'စောင့်ဆိုင်းဆဲ',
    repairing: 'ပြင်ဆင်ဆဲ',
    ready: 'ပြီးစီးပါပြီ',
    delivered: 'ထုတ်ယူပြီး',
    reject: 'မပြင်ဖြစ်ပါ (Reject)',
    customer: 'ဝယ်ယူသူ',
    phone: 'ဖုန်းနံပါတ်',
    device: 'စက်အမျိုးအစား',
    issue: 'ဖြစ်သည့်လက္ခဏာ',
    imeiSn: 'IMEI/SN',
    initialCondition: 'မူလအခြေအနေ',
    total: 'စုစုပေါင်း',
    payment: 'ငွေပေးချေမှု',
    save: 'သိမ်းဆည်းမည်',
    saving: 'သိမ်းဆည်းနေပါသည်...',
    receipt: 'ဖြတ်ပိုင်း',
    print: 'ပရင့်ထုတ်ရန်',
    reprint: 'ပြန်ထုတ်ရန်',
    stock: 'လက်ကျန်',
    price: 'ရောင်းစျေး',
    costPrice: 'ဝယ်စျေး',
    category: 'အမျိုးအစား',
    description: 'အကြောင်းအရာ',
    quickAdd: 'အမြန်ထည့်ရန်',
    entries: 'မှတ်တမ်းများ',
    scanSearch: 'ပစ္စည်းရှာဖွေမည်...',
    warehouseEmpty: 'ပစ္စည်းမရှိပါ',
    salesTerminal: 'အရောင်းစက်',
    finalize: 'ငွေရှင်းမည်',
    dbSetup: 'ဒေတာဘေ့စ် စနစ်သွင်းရန်',
    initializeDb: 'Sheet အားလုံးစတင်ရန်',
    appVersion: 'ဗားရှင်း',
    theme: 'ဖန်သားပြင်',
    language: 'ဘာသာစကား',
    exportData: 'ဒေတာ သိမ်းဆည်းရန် (Backup)',
    startDate: 'စတင်သည့်ရက်',
    endDate: 'ပြီးဆုံးသည့်ရက်',
    selectSheet: 'Sheet ရွေးချယ်ပါ',
    btnExport: 'CSV ထုတ်ယူမည်',
    allSheets: 'Full Archive (ဒေတာအားလုံး)',
    channel: 'အရောင်းလမ်းကြောင်း',
    walkin: 'ဆိုင်သို့လာရောက်ဝယ်ယူသူ',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    telegram: 'Telegram',
    warranty: 'အာမခံကာလ',
    checkoutTitle: 'အရောင်းပြေစာ ဖြည့်သွင်းရန်',
    specification: 'အသေးစိတ်အချက်အလက်',
    allGrades: 'အားလုံး',
    brandNew: 'အသစ်စက်စက် (New)',
    used: 'တစ်ပတ်ရစ် (Used)',
    type_phone: 'ဖုန်း (Phone)',
    type_accessories: 'ဆက်စပ်ပစ္စည်း (Accessories)',
    type_computer: 'ကွန်ပျူတာ (Computer)',
    type_serviceparts: 'ပြုပြင်ရေးပစ္စည်း (Service Parts)',
    type_others: 'အခြား (Others)',
    voucherSettings: 'Voucher နှင့် ဆိုင်အချက်အလက် စီမံရန်',
    storeName: 'ဆိုင်အမည်',
    storeTagline: 'ဆိုင်အညွှန်း / Tagline',
    logoText: 'Logo စာလုံး',
    footerText: 'အောက်ခြေစကားသံ / အာမခံညွှန်း',
    receiptSize: 'ပုံမှန်ပြေစာအရွယ်အစား (Voucher Size)',
    saveSettings: 'သတ်မှတ်ချက်များသိမ်းရန်',
    settingsSaved: 'သတ်မှတ်ချက်များ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။',
    enterPin: 'လုံခြုံရေး ပင်နံပါတ် (PIN) ရိုက်ထည့်ပါ',
    invalidPin: 'လုံခြုံရေး ပင်နံပါတ် မှားယွင်းနေပါသည်။',
    logout: 'အကောင့်ထွက်ရန်',
    staffManagement: 'လုပ်ငန်းဝင် ဝန်ထမ်းအကောင့်များ စီမံခန့်ခွဲမှု',
    staffList: 'ဝန်ထမ်းစာရင်းများ',
    addStaff: 'ဝန်ထမ်းအကောင့်အသစ်ထည့်ရန်',
    staffName: 'ဝန်ထမ်းအမည်',
    staffEmail: 'ဂျီမေးလ်လိပ်စာ',
    staffPin: 'လုံခြုံရေး ပင်နံပါတ် (၄ လုံး)',
    staffRole: 'ဝင်ရောက်ခွင့်အဆင့်အတန်း (ရာထူး)',
    staffStatus: 'အကောင့်အခြေအနေ',
    onlyAdminSettings: 'ဤဆက်တင်အား ဆောင်ရွက်ရန် Admin အကောင့်ဝင်ရန် လိုအပ်ပါသည်။',
    costPricesHidden: 'ဝယ်စျေးနှင့် အမြတ်များကို ဝန်ထမ်းများ မမြင်နိုင်ရန် ပိတ်ထားပါသည်',
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('ksm_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [activeView, setActiveView] = useState('dashboard');
  const defaultCategories = ['Phone', 'Accessories', 'Computer', 'Service Parts', 'Others'];
  const defaultAccessoryCategories = ['အားသွင်းကြိုး', 'အားသွင်းခေါင်း', 'အားသွင်းကြိုး+ခေါင်း', 'နားကြပ်', 'မှန်မကွဲ', 'ကာဗာ', 'PowerBank', 'အခြား', 'ငွေဖြည့်ကဒ်'];
  const [productCategories, setProductCategories] = useState<string[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('ksm_product_categories') || '[]'); return Array.isArray(saved) && saved.length ? saved : defaultCategories; } catch { return defaultCategories; }
  });
  const [accessoryCategories, setAccessoryCategories] = useState<string[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('ksm_accessory_categories') || '[]'); return Array.isArray(saved) && saved.length ? Array.from(new Set([...saved, ...defaultAccessoryCategories])) : defaultAccessoryCategories; } catch { return defaultAccessoryCategories; }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('ksm_lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('ksm_theme') || 'light');

  // Data states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [repairs, setRepairs] = useState<RepairJob[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [report, setReport] = useState<FinancialReport>({ sales: 0, expenses: 0, profit: 0 });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All Time');

  // Store Settings
  const [storeName, setStoreName] = useState(localStorage.getItem('ksm_store_name') || 'KSM POS');
  const [storeTagline, setStoreTagline] = useState(localStorage.getItem('ksm_store_tagline') || 'SMART MOBILE POS');
  const [storeLogo, setStoreLogo] = useState(localStorage.getItem('ksm_store_logo') || `${import.meta.env.BASE_URL}ksm-logo.png`);
  const [storeFooter, setStoreFooter] = useState(localStorage.getItem('ksm_store_footer') || 'THANK YOU FOR YOUR PATRONAGE!\nKSM Warranty Secured');
  const [storePaperSize, setStorePaperSize] = useState<'80mm' | 'A5' | 'A4'>((localStorage.getItem('ksm_store_paper_size') as any) || '80mm');

  // Cart & Modals
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CartItem | InventoryItem | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showGasGuide, setShowGasGuide] = useState(false);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const t = (key: string) => translations[lang]?.[key] || key;

  // Sync theme
  useEffect(() => {
    localStorage.setItem('ksm_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync lang
  useEffect(() => {
    localStorage.setItem('ksm_lang', lang);
  }, [lang]);

  // Sync current user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ksm_user', JSON.stringify(currentUser));
      refreshAll();
    } else {
      localStorage.removeItem('ksm_user');
    }
  }, [currentUser]);



  const refreshAll = () => {
    callRpc('getInventoryData').then(data => setInventory(data || [])).catch(console.error);
    callRpc('getRepairData').then(data => setRepairs(data || [])).catch(console.error);
    callRpc('getExpensesData').then(data => setExpenses(data || [])).catch(console.error);
    callRpc('getPurchasesData').then(data => setPurchases(Array.isArray(data) ? data : [])).catch(err => { console.warn('Purchases unavailable:', err); setPurchases([]); });
    callRpc('getSalesHistory').then(data => setSalesHistory(data || [])).catch(console.error);
    callRpc('getFinancialReport').then(data => setReport(data || { sales: 0, expenses: 0, profit: 0 })).catch(console.error);
    callRpc('getSettings').then(data => {
      if (data) {
        if (data.store_name) setStoreName(data.store_name);
        if (data.store_tagline) setStoreTagline(data.store_tagline);
        if (data.store_logo) setStoreLogo(data.store_logo);
        if (data.store_footer) setStoreFooter(data.store_footer);
        if (data.store_paper_size) setStorePaperSize(data.store_paper_size);
        const parseCategorySetting = (value: unknown): string[] => {
          if (Array.isArray(value)) return value.map(String).map(v => v.trim()).filter(Boolean);
          if (typeof value !== 'string' || !value.trim()) return [];
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String).map(v => v.trim()).filter(Boolean) : [];
          } catch {
            return value.split(',').map(v => v.trim()).filter(Boolean);
          }
        };
        const serverProducts = parseCategorySetting(data.product_categories);
        const serverAccessories = parseCategorySetting(data.accessory_categories);
        if (serverProducts.length) {
          setProductCategories(serverProducts);
          localStorage.setItem('ksm_product_categories', JSON.stringify(serverProducts));
        }
        if (serverAccessories.length) {
          setAccessoryCategories(serverAccessories);
          localStorage.setItem('ksm_accessory_categories', JSON.stringify(serverAccessories));
        }
      }
    }).catch(console.error);
    callRpc('getStaffMembers').then(data => setStaffMembers(data || [])).catch(console.error);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleAddToPosCart = (product: InventoryItem) => {
    const availableStock = Number(product.stock) || 0;
    const productId = product.id || product.productid || 'WALK-IN';
    if (availableStock <= 0) {
      alert('This item is out of stock.');
      return;
    }

    setPosCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === productId);
      const currentQuantity = prev
        .filter(item => item.id === productId)
        .reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

      if (currentQuantity >= availableStock) {
        alert(`Only ${availableStock} item(s) are available in stock.`);
        return prev;
      }

      if (existingIndex >= 0) {
        return prev.map((item, index) => index === existingIndex
          ? { ...item, quantity: (Number(item.quantity) || 1) + 1 }
          : item
        );
      }

      const cartItem: CartItem = {
        cartItemId: 'cart-' + Date.now() + '-' + Math.round(Math.random() * 1000),
        id: productId,
        brand: product.brand,
        model: product.model,
        price: Number(product.sellingprice || product.price) || 0,
        costprice: Number(product.costprice || product.costPrice) || 0,
        specification: product.specification || '-',
        imei: product.imei || product.barcode || '',
        warranty: 'No Warranty',
        stock: availableStock,
        discountType: 'none',
        discountValue: 0,
        quantity: 1,
        imageid: product.imageid || product.imageId || product.imageurl || product.imageUrl || '',
        imageId: product.imageId || product.imageid || product.imageUrl || product.imageurl || '',
        imageurl: product.imageurl || product.imageUrl || product.imageid || product.imageId || '',
        imageUrl: product.imageUrl || product.imageurl || product.imageId || product.imageid || ''
      };
      return [...prev, cartItem];
    });
  };

  const handleSaveSale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const form = e.currentTarget;

    const customerName = (form.elements.namedItem('customerName') as HTMLInputElement)?.value || 'Walk-in';
    const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value || '-';
    const paymentMethod = (form.elements.namedItem('payment') as HTMLSelectElement)?.value || 'Cash';
    const channel = (form.elements.namedItem('channel') as HTMLSelectElement)?.value || 'Walk-in';

    let itemsToSave: any[] = [];
    if (posCart.length > 0) {
      itemsToSave = posCart.flatMap((item) => {
        const orig = Number(item.price) || 0;
        const dtype = item.discountType || 'none';
        const dval = Number(item.discountValue) || 0;
        const quantity = Math.max(1, Number(item.quantity) || 1);
        let adjustedPrice = orig;
        let discInfo = "";
        if (dtype === 'foc') {
          adjustedPrice = 0;
          discInfo = "FOC / Gift";
        } else if (dtype === 'percent') {
          adjustedPrice = orig - Math.round((orig * dval) / 100);
          discInfo = `Discount ${dval}%`;
        } else if (dtype === 'amount') {
          adjustedPrice = Math.max(0, orig - dval);
          discInfo = `Discount ${dval.toLocaleString()} MMK`;
        }

        return Array.from({ length: quantity }, (_, index) => ({
          productId: item.id || "WALK-IN",
          model: item.model,
          price: adjustedPrice,
          costPrice: item.costprice || 0,
          specification: item.specification || '-',
          imei: quantity > 1 && index > 0 ? '-' : (item.imei || '-'),
          warranty: item.warranty || 'No Warranty',
          remark: discInfo,
        }));
      });
    }

    const cashReceived = Number((form.elements.namedItem('cashReceived') as HTMLInputElement)?.value || 0);
    const totalAmount = itemsToSave.reduce((sum, item) => sum + item.price, 0);
    const changeAmount = paymentMethod === 'Cash' ? Math.max(0, cashReceived - totalAmount) : 0;
    const baseRemark = (form.elements.namedItem('remark') as HTMLInputElement)?.value || '';
    const paymentRemark = paymentMethod === 'Cash'
      ? `Cash received: ${cashReceived.toLocaleString()} MMK | Change: ${changeAmount.toLocaleString()} MMK`
      : '';

    const checkoutData = {
      customer: customerName,
      phone,
      paymentMethod,
      channel,
      remark: [baseRemark, paymentRemark].filter(Boolean).join(' | '),
      items: itemsToSave
    };

    callRpc('recordMultipleSales', checkoutData)
      .then((res) => {
        setIsSaving(false);
        if (res && res.status === 'error') {
          alert('Error: ' + res.message);
          return;
        }

        setCurrentReceipt({
          id: res.voucherNo || ('V-' + Date.now().toString().slice(-6)),
          date: new Date().toLocaleString(),
          customer: customerName,
          phone,
          items: itemsToSave,
          total: totalAmount,
          paymentMethod,
          cashReceived: paymentMethod === 'Cash' ? cashReceived : totalAmount,
          changeAmount,
          remark: baseRemark,
          type: 'Official Voucher',
          channel
        });

        setPosCart([]);
        setShowSaleModal(false);
        setShowReceiptModal(true);
        refreshAll();
      })
      .catch((err) => {
        setIsSaving(false);
        alert(err.toString());
      });
  };

  const handleSavePurchase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const form = e.currentTarget;
    const productId = (form.elements.namedItem('productId') as HTMLSelectElement).value;
    const product = inventory.find(p => String(p.id || p.productid) === String(productId));
    const quantity = Number((form.elements.namedItem('quantity') as HTMLInputElement).value);
    const unitCost = Number((form.elements.namedItem('unitCost') as HTMLInputElement).value);
    const paidAmount = Number((form.elements.namedItem('paidAmount') as HTMLInputElement).value || 0);
    const payload = {
      productId,
      productName: product ? `${product.brand || ''} ${product.model || ''}`.trim() : productId,
      supplier: (form.elements.namedItem('supplier') as HTMLInputElement).value,
      invoiceNo: (form.elements.namedItem('invoiceNo') as HTMLInputElement).value,
      quantity, unitCost, paidAmount,
      costMode: (form.elements.namedItem('costMode') as HTMLSelectElement)?.value || 'average',
      paymentMethod: (form.elements.namedItem('paymentMethod') as HTMLSelectElement).value,
      remark: (form.elements.namedItem('remark') as HTMLInputElement).value,
      notedBy: currentUser?.name || 'Admin'
    };
    callRpc('savePurchase', payload).then(res => {
      setIsSaving(false);
      if (!res || res.status !== 'success') {
        alert(res?.message || (lang === 'mm' ? 'ဝယ်ယူမှု မသိမ်းနိုင်ပါ။ Google Apps Script အသစ်ကို Deploy လုပ်ထားကြောင်း စစ်ဆေးပါ။' : 'Could not save purchase. Please deploy the updated Google Apps Script as a new Web App version.'));
        return;
      }
      setShowPurchaseModal(false);
      refreshAll();
      alert(lang === 'mm' ? 'ဝယ်ယူမှုသိမ်းပြီး Stock တိုးပြီးပါပြီ။' : 'Purchase saved and stock updated.');
    }).catch(err => { setIsSaving(false); alert(err.toString()); });
  };

  const handleSaveExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const form = e.currentTarget;

    const formData = {
      description: (form.elements.namedItem('description') as HTMLInputElement).value,
      category: (form.elements.namedItem('category') as HTMLSelectElement).value,
      amount: Number((form.elements.namedItem('amount') as HTMLInputElement).value),
      notedBy: currentUser?.name || 'Admin'
    };

    callRpc('saveExpense', formData)
      .then(() => {
        setIsSaving(false);
        setShowExpenseModal(false);
        refreshAll();
      })
      .catch(err => {
        setIsSaving(false);
        alert(err.toString());
      });
  };

  const handleSaveInventory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const form = e.currentTarget;

    const formData = {
      type: (form.elements.namedItem('type') as HTMLSelectElement).value,
      brand: (form.elements.namedItem('brand') as HTMLInputElement).value,
      model: (form.elements.namedItem('model') as HTMLInputElement).value,
      specification: (() => {
        const base = (form.elements.namedItem('specification') as HTMLTextAreaElement).value || '-';
        const accessory = (form.elements.namedItem('accessory_type') as HTMLSelectElement)?.value || '';
        return accessory ? `[${accessory}] ${base}` : base;
      })(),
      costPrice: Number((form.elements.namedItem('costPrice') as HTMLInputElement).value),
      price: Number((form.elements.namedItem('price') as HTMLInputElement).value),
      stock: Number((form.elements.namedItem('stock') as HTMLInputElement).value),
      grade: (form.elements.namedItem('grade') as HTMLSelectElement)?.value || 'New',
      accessoryType: (form.elements.namedItem('accessory_type') as HTMLSelectElement)?.value || '',
      imei: (form.elements.namedItem('imei') as HTMLInputElement)?.value || '-',
      barcode: (form.elements.namedItem('barcode') as HTMLInputElement)?.value || '-',
      imageId: (form.elements.namedItem('imageId') as HTMLInputElement)?.value || ''
    };

    callRpc('saveInventory', formData)
      .then(() => {
        setIsSaving(false);
        setShowInventoryModal(false);
        refreshAll();
      })
      .catch(err => {
        setIsSaving(false);
        alert(err.toString());
      });
  };

  const handleSaveRepair = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const form = e.currentTarget;

    const formData = {
      customerName: (form.elements.namedItem('customer') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      device: (form.elements.namedItem('device') as HTMLInputElement).value,
      issue: (form.elements.namedItem('issue') as HTMLTextAreaElement).value,
      imei: (form.elements.namedItem('imei') as HTMLInputElement).value || '-',
      condition: (form.elements.namedItem('condition') as HTMLInputElement).value || '-',
      total: Number((form.elements.namedItem('total') as HTMLInputElement).value),
      remark: (form.elements.namedItem('remark') as HTMLInputElement)?.value || '',
      fee: 0,
      startTime: new Date().toISOString()
    };

    callRpc('saveRepair', formData)
      .then((res) => {
        setIsSaving(false);
        setShowRepairModal(false);
        setCurrentReceipt({
          id: res.id || ('REP-' + Math.floor(Math.random() * 9000 + 1000)),
          date: new Date().toLocaleString(),
          customer: formData.customerName,
          phone: formData.phone,
          items: [{ model: formData.device, issue: formData.issue, price: formData.total, imei: formData.imei, specification: formData.condition }],
          total: formData.total,
          remark: formData.remark,
          type: 'Repair Ticket'
        });
        setShowReceiptModal(true);
        refreshAll();
      })
      .catch(err => {
        setIsSaving(false);
        alert(err.toString());
      });
  };

  const handleSaveStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const form = e.currentTarget;

    const staffObj = {
      name: (form.elements.namedItem('staffName') as HTMLInputElement).value,
      email: (form.elements.namedItem('staffEmail') as HTMLInputElement).value,
      pin: (form.elements.namedItem('staffPIN') as HTMLInputElement).value,
      role: (form.elements.namedItem('staffRole') as HTMLSelectElement).value as any,
      status: (form.elements.namedItem('staffStatus') as HTMLSelectElement).value as any
    };

    callRpc('saveStaffMember', staffObj)
      .then((res) => {
        setIsSaving(false);
        if (res && res.status === 'success') {
          alert('Staff member profile saved successfully.');
          setShowAddStaffForm(false);
          setEditingStaff(null);
          refreshAll();
        } else {
          alert(res?.message || 'Failed to save staff');
        }
      })
      .catch(err => {
        setIsSaving(false);
        alert(err.toString());
      });
  };

  const handleDeleteStaff = (name: string) => {
    if (window.confirm(`Delete ${name} from system?`)) {
      callRpc('deleteStaffMember', name)
        .then(() => refreshAll())
        .catch(err => alert(err.toString()));
    }
  };

  const handleUpdateStatus = (ticketId: string, newStatus: RepairStatus) => {
    callRpc('updateRepairStatus', { id: ticketId, status: newStatus, finishTime: (newStatus === 'Done' || newStatus === 'Delivered') ? new Date().toISOString() : '' })
      .then(() => refreshAll())
      .catch(err => alert(err.toString()));
  };

  const handleReprintReceipt = (type: 'Official Voucher' | 'Repair Ticket', item: any) => {
    if (type === 'Repair Ticket') {
      setCurrentReceipt({
        id: item.ticketid,
        date: item.createdat,
        customer: item.customername,
        phone: item.phone,
        items: [{ 
          model: item.device, 
          issue: item.issue, 
          price: Number(item.total),
          imei: item.imeisn,
          specification: item.initialcondition
        }],
        total: Number(item.total),
        type: 'Repair Ticket'
      });
    } else {
      setCurrentReceipt({
        id: item.voucherno || item.productid || 'SALE',
        date: item.timestamp,
        customer: item.customer,
        phone: item.phone,
        channel: item.channel,
        items: [{ 
          model: item.type || item.model, 
          price: Number(item.price),
          imei: item.imei,
          specification: item.specification,
          warranty: item.warranty,
          remark: item.remark || ''
        }],
        total: Number(item.price),
        remark: item.remark || '',
        type: 'Official Voucher'
      });
    }
    setShowReceiptModal(true);
  };

  const handleExportData = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const sheetName = (form.elements.namedItem('sheetName') as HTMLSelectElement).value;

    callRpc('getExportData', { name: sheetName })
      .then(data => {
        if (!data || data.length === 0) {
          alert('No data to export');
          return;
        }
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        data.forEach((row: any) => {
          const values = headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`);
          csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${sheetName}_Backup_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!currentUser) {
    return (
      <LoginModal 
        setCurrentUser={setCurrentUser}
        storeName={storeName}
        storeTagline={storeTagline}
        storeLogo={storeLogo}
        lang={lang}
        setLang={setLang}
        t={t}
      />
    );
  }

  return (
    <div className="flex h-dvh w-full bg-[#f0f2f5] dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        storeName={storeName}
        storeLogo={storeLogo}
        setShowGasGuide={setShowGasGuide}
        lang={lang}
        t={t}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <Header 
          activeView={activeView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          isSaving={isSaving}
          refreshAll={refreshAll}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          setIsSidebarOpen={setIsSidebarOpen}
          currentUser={currentUser}
          t={t}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-4 lg:p-8">
          {activeView === 'dashboard' && (
            <DashboardView 
              salesHistory={salesHistory}
              repairs={repairs}
              expenses={expenses}
              inventory={inventory}
              currentUser={currentUser}
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              searchQuery={searchQuery}
              lang={lang}
              t={t}
              handleReprintReceipt={handleReprintReceipt}
            />
          )}

          {activeView === 'inventory' && (
            <InventoryView 
              inventory={inventory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showInventoryModal={showInventoryModal}
              setShowInventoryModal={setShowInventoryModal}
              handleSaveInventory={handleSaveInventory}
              isSaving={isSaving}
              lang={lang}
              t={t}
              handleAddToPosCart={handleAddToPosCart}
              setActiveView={setActiveView}
              posCart={posCart}
              setPosCart={setPosCart}
              productCategories={productCategories}
              accessoryCategories={accessoryCategories}
            />
          )}

          {activeView === 'sales' && (
            <PosView 
              inventory={inventory}
              salesHistory={salesHistory}
              posCart={posCart}
              setPosCart={setPosCart}
              handleAddToPosCart={handleAddToPosCart}
              showSaleModal={showSaleModal}
              setShowSaleModal={setShowSaleModal}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              handleSaveSale={handleSaveSale}
              isSaving={isSaving}
              currentUser={currentUser}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              lang={lang}
              t={t}
              handleReprintReceipt={handleReprintReceipt}
              refreshAll={refreshAll}
              productCategories={productCategories}
            />
          )}

          {activeView === 'repairs' && (
            <RepairsView 
              repairs={repairs}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              showRepairModal={showRepairModal}
              setShowRepairModal={setShowRepairModal}
              handleSaveRepair={handleSaveRepair}
              handleUpdateStatus={handleUpdateStatus}
              handleReprintReceipt={handleReprintReceipt}
              isSaving={isSaving}
              lang={lang}
              t={t}
            />
          )}

          {activeView === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              inventory={inventory}
              showPurchaseModal={showPurchaseModal}
              setShowPurchaseModal={setShowPurchaseModal}
              handleSavePurchase={handleSavePurchase}
              isSaving={isSaving}
              lang={lang}
            />
          )}

          {activeView === 'expenses' && (
            <ExpensesView 
              expenses={expenses}
              report={report}
              showExpenseModal={showExpenseModal}
              setShowExpenseModal={setShowExpenseModal}
              handleSaveExpense={handleSaveExpense}
              isSaving={isSaving}
              lang={lang}
              t={t}
            />
          )}

          {activeView === 'staff' && (
            <StaffView 
              staffMembers={staffMembers}
              currentUser={currentUser}
              showAddStaffForm={showAddStaffForm}
              setShowAddStaffForm={setShowAddStaffForm}
              editingStaff={editingStaff}
              setEditingStaff={setEditingStaff}
              handleSaveStaff={handleSaveStaff}
              handleDeleteStaff={handleDeleteStaff}
              isSaving={isSaving}
              lang={lang}
              t={t}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView 
              storeName={storeName}
              setStoreName={setStoreName}
              storeTagline={storeTagline}
              setStoreTagline={setStoreTagline}
              storeLogo={storeLogo}
              setStoreLogo={setStoreLogo}
              storeFooter={storeFooter}
              setStoreFooter={setStoreFooter}
              storePaperSize={storePaperSize}
              setStorePaperSize={setStorePaperSize}
              currentUser={currentUser}
              handleExportData={handleExportData}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              setShowGasGuide={setShowGasGuide}
              lang={lang}
              t={t}
              productCategories={productCategories}
              setProductCategories={setProductCategories}
              accessoryCategories={accessoryCategories}
              setAccessoryCategories={setAccessoryCategories}
            />
          )}
        </div>

        <footer className="hidden sm:flex h-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center px-6 shrink-0 text-[11px] font-bold text-slate-400">
          <span>KSM Phone Shop Management & POS Studio ✨</span>
        </footer>
      </main>

      {/* Receipt Modal */}
      {showReceiptModal && currentReceipt && (
        <ReceiptModal 
          currentReceipt={currentReceipt}
          setShowReceiptModal={setShowReceiptModal}
          storeName={storeName}
          storeTagline={storeTagline}
          storeLogo={storeLogo}
          storeFooter={storeFooter}
          storePaperSize={storePaperSize}
          handlePrint={handlePrint}
          refreshAll={refreshAll}
          lang={lang}
          t={t}
        />
      )}

      {/* GAS Guide Modal */}
      {showGasGuide && currentUser.role === 'Admin' && (
        <GasGuideModal 
          setShowGasGuide={setShowGasGuide}
          lang={lang}
        />
      )}
    </div>
  );
}
