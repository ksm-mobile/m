/**
 * KSM POS System - Data Types & Interfaces
 */

export type Role = 'Admin' | 'Staff';
export type UserStatus = 'Active' | 'Suspended';

export interface User {
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  pin?: string;
  authenticated?: boolean;
}

export type ProductType = 'Phone' | 'Accessories' | 'Computer' | 'Service Parts' | 'Others';
export type GradeType = 'New' | 'Used';

export interface InventoryItem {
  id: string;
  type: string;
  brand: string;
  model: string;
  costPrice: number;
  price: number;
  stock: number;
  status?: string;
  imei?: string;
  grade?: string;
  accessorytype?: string;
  accessoryType?: string;
  specification?: string;
  // Normalized lowercase field names for compatibility with GAS display values
  costprice?: number;
  sellingprice?: number;
  productid?: string;
  barcode?: string;
  imageid?: string;
  imageId?: string;
  imageurl?: string;
  imageUrl?: string;
}

export interface CartItem {
  cartItemId: string;
  id: string;
  brand: string;
  model: string;
  price: number;
  costprice: number;
  specification: string;
  imei: string;
  warranty: string;
  stock: number;
  discountType: 'none' | 'percent' | 'amount' | 'foc';
  discountValue: number;
  quantity?: number;
  imageid?: string;
  imageId?: string;
  imageurl?: string;
  imageUrl?: string;
}

export interface SaleRecord {
  timestamp: string;
  voucherno: string;
  productid: string;
  type: string;
  price: number;
  customer: string;
  phone: string;
  imei: string;
  warranty: string;
  paymentmethod: string;
  channel: string;
  specification: string;
  remark: string;
  costprice?: number;
  profit?: number;
}

export type RepairStatus = 'Pending' | 'Repairing' | 'Done' | 'Delivered' | 'Reject';

export interface RepairJob {
  ticketid: string;
  customername: string;
  phone: string;
  device: string;
  issue: string;
  imeisn?: string;
  initialcondition?: string;
  status: RepairStatus;
  fee: number;
  total: number;
  createdat: string;
  starttime?: string;
  finishtime?: string;
  remark?: string;
  condition?: string;
}

export interface PurchaseRecord {
  date: string;
  purchaseno: string;
  invoiceno: string;
  supplier: string;
  productid: string;
  productname: string;
  quantity: number;
  unitcost: number;
  total: number;
  paidamount: number;
  balance: number;
  paymentmethod: string;
  notedby?: string;
  remark?: string;
}

export interface ExpenseRecord {
  date: string;
  description: string;
  category: string;
  amount: number;
  notedby?: string;
}

export interface StoreSettings {
  store_name: string;
  store_tagline: string;
  store_logo: string;
  store_footer: string;
  store_paper_size: '80mm' | 'A5' | 'A4';
  gas_web_app_url?: string;
}

export interface ReceiptData {
  id: string;
  date: string;
  customer: string;
  phone?: string;
  channel?: string;
  items: Array<{
    model: string;
    price: number;
    specification?: string;
    imei?: string;
    warranty?: string;
    issue?: string;
    remark?: string;
  }>;
  total: number;
  paymentMethod?: string;
  cashReceived?: number;
  changeAmount?: number;
  remark?: string;
  type: 'Official Voucher' | 'Repair Ticket';
}

export interface FinancialReport {
  sales: number;
  expenses: number;
  profit: number;
  salesRevenue?: number;
  repairRevenue?: number;
  totalProfit?: number;
}
