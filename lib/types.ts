export interface User {
  id: string;
  phone?: string;
  email?: string;
}

export interface Shop {
  id: string;
  user_id?: string | null;
  name: string;
  gst_number?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  created_at?: string;
}

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  created_at?: string;
}

export interface Company {
  id: string;
  shop_id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  account_number?: string | null;
  bank_name?: string | null;
  ifsc_code?: string | null;
  gstin?: string | null;
  address?: string | null;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  pack_quantity: number | null;
  unit: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  expiry_date?: string | null;
  created_at?: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  company?: string | null;
  company_id?: string | null;
  company_obj?: Company | null;
  category_id?: string | null;
  category?: Category | null;
  created_at?: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  mobile?: string | null;
  village?: string | null;
  created_at?: string;
}

export interface Farmer {
  id: string;
  shop_id: string;
  name: string;
  mobile?: string | null;
  aadhar_number?: string | null;
  village?: string | null;
  land_acres?: number | null;
  crop_types?: string[] | null;
  notes?: string | null;
  katha_balance?: number;
  created_at?: string;
}

export interface KathaPayment {
  id: string;
  shop_id: string;
  farmer_id: string;
  amount: number;
  notes?: string | null;
  created_at?: string;
}

export interface FarmerWithHistory extends Farmer {
  sales?: SaleWithItems[];
  katha_payments?: KathaPayment[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string | null;
  variant_id?: string | null;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

export interface Sale {
  id: string;
  shop_id: string;
  bill_number: string;
  farmer_id?: string | null;
  customer_name: string;
  customer_mobile?: string | null;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_mode: 'CASH' | 'UPI' | 'CREDIT';
  created_at?: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

export interface CreateSaleInput {
  shop_id: string;
  customer_name: string;
  customer_mobile?: string | null;
  farmer_id?: string | null;
  discount_amount?: number;
  payment_mode?: 'CASH' | 'UPI' | 'CREDIT';
  items: Array<{
    product_id: string;
    variant_id: string;
    product_name: string;
    variant_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

export type UnitOption = 'ml' | 'L' | 'g' | 'kg' | 'piece' | 'bag' | 'packet' | 'bottle' | 'can';

export const PREDEFINED_UNITS: UnitOption[] = [
  'ml',
  'L',
  'g',
  'kg',
  'piece',
  'bag',
  'packet',
  'bottle',
  'can',
];

export const PREDEFINED_CATEGORIES = [
  'Fertilizers',
  'Herbicides',
  'Pesticides',
  'Bio-stimulants',
  'Seeds',
  'Plant Growth Regulators',
  'Other',
];
