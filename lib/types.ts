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

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  pack_quantity: number | null;
  unit: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  created_at?: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  company?: string | null;
  category_id?: string | null;
  category?: Category | null;
  created_at?: string;
}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
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
