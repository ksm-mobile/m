import { InventoryItem, SaleRecord, RepairJob, ExpenseRecord, User, StoreSettings } from '../types';

export const initialInventory: InventoryItem[] = [
  // Phones - Brand New
  {
    id: 'PRD-1001',
    type: 'Phone',
    brand: 'Apple',
    model: 'iPhone 16 Pro Max',
    costPrice: 4200000,
    price: 4550000,
    stock: 4,
    status: 'Active',
    imei: '358920194829101',
    grade: 'New',
    specification: '256GB • Natural Titanium • Battery 100%',
    costprice: 4200000,
    sellingprice: 4550000
  },
  {
    id: 'PRD-1002',
    type: 'Phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    costPrice: 3200000,
    price: 3480000,
    stock: 3,
    status: 'Active',
    imei: '358920194829102',
    grade: 'New',
    specification: '128GB • Blue Titanium',
    costprice: 3200000,
    sellingprice: 3480000
  },
  {
    id: 'PRD-1003',
    type: 'Phone',
    brand: 'Apple',
    model: 'iPhone 13',
    costPrice: 1950000,
    price: 2150000,
    stock: 6,
    status: 'Active',
    imei: '358920194829103',
    grade: 'New',
    specification: '128GB • Midnight',
    costprice: 1950000,
    sellingprice: 2150000
  },
  {
    id: 'PRD-1004',
    type: 'Phone',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    costPrice: 3800000,
    price: 4150000,
    stock: 5,
    status: 'Active',
    imei: '359029103920191',
    grade: 'New',
    specification: '12GB/512GB • Titanium Gray • S-Pen',
    costprice: 3800000,
    sellingprice: 4150000
  },
  {
    id: 'PRD-1005',
    type: 'Phone',
    brand: 'Samsung',
    model: 'Galaxy A55 5G',
    costPrice: 1250000,
    price: 1380000,
    stock: 8,
    status: 'Active',
    imei: '359029103920192',
    grade: 'New',
    specification: '8GB/256GB • Awesome Iceblue',
    costprice: 1250000,
    sellingprice: 1380000
  },
  {
    id: 'PRD-1006',
    type: 'Phone',
    brand: 'Xiaomi',
    model: 'Redmi Note 13 Pro+ 5G',
    costPrice: 1100000,
    price: 1240000,
    stock: 7,
    status: 'Active',
    imei: '869201920392011',
    grade: 'New',
    specification: '12GB/512GB • Midnight Black • 120W Fast Charge',
    costprice: 1100000,
    sellingprice: 1240000
  },
  {
    id: 'PRD-1007',
    type: 'Phone',
    brand: 'Vivo',
    model: 'Vivo V30 5G',
    costPrice: 1300000,
    price: 1450000,
    stock: 4,
    status: 'Active',
    imei: '867392019283012',
    grade: 'New',
    specification: '12GB/256GB • Peacock Green • Aura Light',
    costprice: 1300000,
    sellingprice: 1450000
  },

  // Phones - Second Hand / Used
  {
    id: 'PRD-1008',
    type: 'Phone',
    brand: 'Apple',
    model: 'iPhone 14 Pro Max (Used)',
    costPrice: 2800000,
    price: 3100000,
    stock: 2,
    status: 'Active',
    imei: '358920194829999',
    grade: 'Used',
    specification: '256GB • Deep Purple • Battery 88% • Full Set Box',
    costprice: 2800000,
    sellingprice: 3100000
  },
  {
    id: 'PRD-1009',
    type: 'Phone',
    brand: 'Apple',
    model: 'iPhone 11 (Used)',
    costPrice: 950000,
    price: 1120000,
    stock: 3,
    status: 'Active',
    imei: '358920194829888',
    grade: 'Used',
    specification: '128GB • Black • Battery 85% • Clean Condition',
    costprice: 950000,
    sellingprice: 1120000
  },
  {
    id: 'PRD-1010',
    type: 'Phone',
    brand: 'Samsung',
    model: 'Galaxy S22 Ultra (Used)',
    costPrice: 1850000,
    price: 2050000,
    stock: 2,
    status: 'Active',
    imei: '359029103920777',
    grade: 'Used',
    specification: '12GB/256GB • Phantom Black • 95% New',
    costprice: 1850000,
    sellingprice: 2050000
  },

  // Accessories
  {
    id: 'PRD-1011',
    type: 'Accessories',
    brand: 'Apple',
    model: 'Apple 20W USB-C Power Adapter',
    costPrice: 65000,
    price: 85000,
    stock: 15,
    status: 'Active',
    imei: '-',
    grade: 'New',
    specification: 'Original Type-C Fast Charger Head',
    costprice: 65000,
    sellingprice: 85000
  },
  {
    id: 'PRD-1012',
    type: 'Accessories',
    brand: 'Anker',
    model: 'Anker PowerBank 20,000mAh 22.5W',
    costPrice: 110000,
    price: 145000,
    stock: 12,
    status: 'Active',
    imei: '-',
    grade: 'New',
    specification: 'Dual USB + Type-C Fast Charge • Black',
    costprice: 110000,
    sellingprice: 145000
  },
  {
    id: 'PRD-1013',
    type: 'Accessories',
    brand: 'Baseus',
    model: 'Baseus 100W Type-C to Type-C Braided Cable',
    costPrice: 18000,
    price: 28000,
    stock: 25,
    status: 'Active',
    imei: '-',
    grade: 'New',
    specification: '1.2m Fast Charging & Data Transfer',
    costprice: 18000,
    sellingprice: 28000
  },

  // Service Parts
  {
    id: 'PRD-1014',
    type: 'Service Parts',
    brand: 'Apple',
    model: 'iPhone 13 OLED Screen Replacement Part',
    costPrice: 380000,
    price: 480000,
    stock: 5,
    status: 'Active',
    imei: '-',
    grade: 'New',
    specification: 'Original Quality OLED Assembly with Touch IC',
    costprice: 380000,
    sellingprice: 480000
  }
];

export const initialSales: SaleRecord[] = [
  {
    timestamp: '26/07/2026 10:30 AM',
    voucherno: 'V-1001',
    productid: 'PRD-1001',
    type: 'iPhone 16 Pro Max',
    price: 4550000,
    customer: 'U Kyaw Swar',
    phone: '09798881234',
    imei: '358920194829101',
    warranty: '1 Year',
    paymentmethod: 'KPay',
    channel: 'Walk-in',
    specification: '256GB • Natural Titanium',
    remark: 'Gift 20W Adapter + Screen Guard',
    costprice: 4200000,
    profit: 350000
  },
  {
    timestamp: '25/07/2026 03:15 PM',
    voucherno: 'V-1002',
    productid: 'PRD-1004',
    type: 'Galaxy S24 Ultra',
    price: 4150000,
    customer: 'Daw Thinzar',
    phone: '09250112233',
    imei: '359029103920191',
    warranty: '1 Year',
    paymentmethod: 'Cash',
    channel: 'Facebook',
    specification: '12GB/512GB • Titanium Gray',
    remark: 'Free Leather Cover',
    costprice: 3800000,
    profit: 350000
  },
  {
    timestamp: '25/07/2026 11:00 AM',
    voucherno: 'V-1003',
    productid: 'PRD-1011',
    type: 'Apple 20W USB-C Power Adapter',
    price: 85000,
    customer: 'Ko Thura',
    phone: '09450009988',
    imei: '-',
    warranty: '3 Months',
    paymentmethod: 'WaveMoney',
    channel: 'Walk-in',
    specification: 'Original Fast Charger',
    remark: '',
    costprice: 65000,
    profit: 20000
  },
  {
    timestamp: '24/07/2026 04:45 PM',
    voucherno: 'V-1004',
    productid: 'PRD-1008',
    type: 'iPhone 14 Pro Max (Used)',
    price: 3100000,
    customer: 'Ma Su Mon',
    phone: '09971234567',
    imei: '358920194829999',
    warranty: '1 Month',
    paymentmethod: 'Bank Transfer',
    channel: 'TikTok',
    specification: '256GB • Deep Purple • Battery 88%',
    remark: 'Discount 50,000 MMK applied',
    costprice: 2800000,
    profit: 300000
  }
];

export const initialRepairs: RepairJob[] = [
  {
    ticketid: 'REP-1001',
    customername: 'U Mg Mg',
    phone: '09420011223',
    device: 'iPhone 13 Pro',
    issue: 'Screen flickering & White Screen display defect',
    imeisn: '357901293019201',
    initialcondition: 'Back glass cracked, Screen white out',
    status: 'Repairing',
    fee: 0,
    total: 350000,
    createdat: '26/07/2026 09:15 AM',
    remark: 'Customer requested Original OLED replacement'
  },
  {
    ticketid: 'REP-1002',
    customername: 'Ma Khin Hnin',
    phone: '09790022334',
    device: 'Samsung Galaxy A52',
    issue: 'Charging port loose & Battery draining fast',
    imeisn: '358901293019202',
    initialcondition: 'Normal body condition',
    status: 'Done',
    fee: 0,
    total: 65000,
    createdat: '25/07/2026 01:30 PM',
    remark: 'Replaced original charging board & Battery'
  },
  {
    ticketid: 'REP-1003',
    customername: 'Ko Htun Htun',
    phone: '09260033445',
    device: 'Redmi Note 10',
    issue: 'Water damaged - No power on',
    imeisn: '868901293019203',
    initialcondition: 'Water indicators red',
    status: 'Pending',
    fee: 0,
    total: 120000,
    createdat: '26/07/2026 11:45 AM',
    remark: 'Pending customer approval for PMIC IC repair'
  }
];

export const initialExpenses: ExpenseRecord[] = [
  {
    date: '26/07/2026',
    description: 'Shop Electricity & Wifi Bill',
    category: 'Utilities',
    amount: 145000,
    notedby: 'Admin'
  },
  {
    date: '24/07/2026',
    description: 'Shop Snacks & Coffee for Customers',
    category: 'General',
    amount: 35000,
    notedby: 'Admin'
  },
  {
    date: '20/07/2026',
    description: 'Monthly Shop Rent',
    category: 'Rent',
    amount: 600000,
    notedby: 'Admin'
  }
];

export const initialStaff: User[] = [
  {
    name: 'Admin',
    email: 'admin@ksm.local',
    role: 'Admin',
    status: 'Active',
    pin: '1234'
  },
  {
    name: 'Mg Mg (Counter Staff)',
    email: 'counter@techsi.com',
    role: 'Staff',
    status: 'Active',
    pin: '5555'
  }
];

export const initialSettings: StoreSettings = {
  store_name: 'KSM POS',
  store_tagline: 'POS & PHONE SERVICES STUDIO',
  store_logo: 'TS',
  store_footer: 'THANK YOU FOR YOUR PATRONAGE!\nKSM Warranty & Genuine Service Secured',
  store_paper_size: '80mm',
  gas_web_app_url: ''
};
