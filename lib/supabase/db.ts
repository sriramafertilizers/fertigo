import { Shop, Category, Product, ProductVariant, ProductWithVariants, User, PREDEFINED_CATEGORIES } from '../types';
import { supabase, isSupabaseConfigured } from './client';

// ----------------------------------------------------
// AUTHENTICATION API (Mobile Number + Password)
// ----------------------------------------------------

function normalizePassword(pass: string): string {
  const p = pass.trim();
  if (p.length < 6) {
    return `${p}_fertigo`;
  }
  return p;
}

export async function signUpWithMobile(mobile: string, pass: string): Promise<User> {
  const cleanMobile = mobile.trim();
  if (!cleanMobile) throw new Error('Mobile number is required.');
  if (pass.length < 5) throw new Error('Password must be at least 5 characters long.');

  const email = cleanMobile.includes('@') ? cleanMobile : `${cleanMobile.replace(/\D/g, '')}@fertigo.app`;
  const safePassword = normalizePassword(pass);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: safePassword,
      options: {
        data: { mobile: cleanMobile },
      },
    });

    if (error) throw new Error(error.message);

    // Try immediate sign in
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password: safePassword,
    });

    if (!signInErr && signInData.user) {
      const user: User = { id: signInData.user.id, phone: cleanMobile, email: signInData.user.email };
      setLocalStore('current_user', user);
      return user;
    }

    if (data.user) {
      const user: User = { id: data.user.id, phone: cleanMobile, email: data.user.email };
      setLocalStore('current_user', user);
      return user;
    }
  }

  // Local Store Fallback
  const users = getLocalStore<User[]>('users', []);
  const existing = users.find((u) => u.phone === cleanMobile || u.email === email);
  if (existing) {
    throw new Error('An account with this mobile number already exists. Please sign in instead.');
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    phone: cleanMobile,
    email: email,
  };
  users.push(newUser);
  setLocalStore('users', users);
  setLocalStore('current_user', newUser);
  return newUser;
}

export async function signInWithMobile(mobile: string, pass: string): Promise<User> {
  const cleanMobile = mobile.trim();
  if (!cleanMobile) throw new Error('Mobile number is required.');
  if (!pass) throw new Error('Password is required.');

  const email = cleanMobile.includes('@') ? cleanMobile : `${cleanMobile.replace(/\D/g, '')}@fertigo.app`;
  const safePassword = normalizePassword(pass);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: safePassword,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error(
          'This account was created while email confirmation was required. Run this SQL in your Supabase SQL Editor to confirm existing users: UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;'
        );
      }
      throw new Error(error.message);
    }

    if (!data.user) throw new Error('Sign in failed.');

    const user: User = { id: data.user.id, phone: cleanMobile, email: data.user.email };
    setLocalStore('current_user', user);
    return user;
  }

  // Local Store Fallback
  const users = getLocalStore<User[]>('users', []);
  let user = users.find((u) => u.phone === cleanMobile || u.email === email);
  if (!user) {
    user = { id: crypto.randomUUID(), phone: cleanMobile, email };
    users.push(user);
    setLocalStore('users', users);
  }
  setLocalStore('current_user', user);
  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      return { id: data.user.id, phone: data.user.user_metadata?.mobile || data.user.email?.split('@')[0], email: data.user.email };
    }
    return null;
  }
  return getLocalStore<User | null>('current_user', null);
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  setLocalStore('current_user', null);
  setLocalStore('active_shop', null);
}

// ----------------------------------------------------
// LOCAL STORAGE HELPERS
// ----------------------------------------------------
function getLocalStore<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(`fertigo_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalStore<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    if (val === null || val === undefined) {
      localStorage.removeItem(`fertigo_${key}`);
    } else {
      localStorage.setItem(`fertigo_${key}`, JSON.stringify(val));
    }
  } catch {
    // ignore
  }
}

// ----------------------------------------------------
// SHOPS API
// ----------------------------------------------------
export async function getShop(shopId?: string): Promise<Shop | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('shops').select('*');
    if (shopId) {
      query = query.eq('id', shopId);
    } else {
      query = query.eq('user_id', currentUser.id);
    }
    const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
    if (!error && data && data.length > 0) return data[0];
    return null;
  }

  const shops = getLocalStore<Shop[]>('shops', []);
  if (shopId) {
    return shops.find((s) => s.id === shopId) || null;
  }
  return shops.find((s) => s.user_id === currentUser.id) || null;
}

export async function getUserShops(): Promise<Shop[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (!error && data) return data;
    return [];
  }

  const shops = getLocalStore<Shop[]>('shops', []);
  return shops.filter((s) => s.user_id === currentUser.id);
}

export async function createShop(shopData: Omit<Shop, 'id' | 'created_at'>): Promise<Shop> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to register a shop.');

  const newShop: Shop = {
    ...shopData,
    id: crypto.randomUUID(),
    user_id: currentUser.id,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('shops')
      .insert(newShop)
      .select()
      .single();
    if (error) throw new Error(error.message);

    const defaultCatRows = PREDEFINED_CATEGORIES.map((catName) => ({
      shop_id: data.id,
      name: catName,
    }));
    await supabase.from('categories').insert(defaultCatRows);
    return data;
  }

  // Local Store Fallback
  const shops = getLocalStore<Shop[]>('shops', []);
  shops.push(newShop);
  setLocalStore('shops', shops);

  const categories = getLocalStore<Category[]>('categories', []);
  PREDEFINED_CATEGORIES.forEach((catName, idx) => {
    categories.push({
      id: `cat-${Date.now()}-${idx}`,
      shop_id: newShop.id,
      name: catName,
      created_at: new Date().toISOString(),
    });
  });
  setLocalStore('categories', categories);

  return newShop;
}

export async function updateShop(shop: Partial<Shop> & { id: string }): Promise<Shop> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('shops')
      .update(shop)
      .eq('id', shop.id)
      .select()
      .single();
    if (!error && data) return data;
  }
  const shops = getLocalStore<Shop[]>('shops', []);
  const idx = shops.findIndex((s) => s.id === shop.id);
  const updated = { ...shops[idx], ...shop };
  if (idx >= 0) shops[idx] = updated;
  setLocalStore('shops', shops);
  return updated as Shop;
}

// ----------------------------------------------------
// CATEGORIES API
// ----------------------------------------------------
export async function getCategories(shopId: string): Promise<Category[]> {
  if (!shopId) return [];
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('shop_id', shopId)
      .order('name');
    if (!error && data) return data;
  }
  const cats = getLocalStore<Category[]>('categories', []);
  return cats.filter((c) => c.shop_id === shopId);
}

export async function createCategory(shopId: string, name: string): Promise<Category> {
  const cleanName = name.trim();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ shop_id: shopId, name: cleanName })
      .select()
      .single();
    if (!error && data) return data;
  }
  const cats = getLocalStore<Category[]>('categories', []);
  const existing = cats.find((c) => c.shop_id === shopId && c.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) return existing;

  const newCat: Category = {
    id: `cat-${Date.now()}`,
    shop_id: shopId,
    name: cleanName,
    created_at: new Date().toISOString(),
  };
  cats.push(newCat);
  setLocalStore('categories', cats);
  return newCat;
}

// ----------------------------------------------------
// PRODUCTS & VARIANTS API
// ----------------------------------------------------
export async function getProducts(shopId: string): Promise<ProductWithVariants[]> {
  if (!shopId) return [];
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as ProductWithVariants[];
  }
  const prods = getLocalStore<ProductWithVariants[]>('products', []);
  return prods.filter((p) => p.shop_id === shopId);
}

export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  if (!id) return null;
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single();
    if (!error && data) return data as ProductWithVariants;
  }
  const prods = getLocalStore<ProductWithVariants[]>('products', []);
  return prods.find((p) => p.id === id) || null;
}

export interface CreateProductInput {
  shop_id: string;
  name: string;
  company?: string | null;
  category_id?: string | null;
  variants: Array<{
    variant_name: string;
    pack_quantity?: number | null;
    unit?: string | null;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    expiry_date?: string | null;
  }>;
}

export async function createProduct(input: CreateProductInput): Promise<ProductWithVariants> {
  const productId = crypto.randomUUID();

  if (isSupabaseConfigured && supabase) {
    const { data: prodData, error: prodErr } = await supabase
      .from('products')
      .insert({
        id: productId,
        shop_id: input.shop_id,
        name: input.name.trim(),
        company: input.company?.trim() || null,
        category_id: input.category_id || null,
      })
      .select()
      .single();

    if (prodErr) throw new Error(prodErr.message);

    const variantRows = input.variants.map((v) => ({
      product_id: productId,
      variant_name: v.variant_name.trim(),
      pack_quantity: v.pack_quantity ?? null,
      unit: v.unit || null,
      cost_price: v.cost_price,
      selling_price: v.selling_price,
      stock_quantity: v.stock_quantity,
      expiry_date: v.expiry_date || null,
    }));

    const { data: varData, error: varErr } = await supabase
      .from('product_variants')
      .insert(variantRows)
      .select();

    if (varErr) throw new Error(varErr.message);

    return getProductById(productId) as Promise<ProductWithVariants>;
  }

  // Local Store Fallback
  const cats = getLocalStore<Category[]>('categories', []);
  const cat = cats.find((c) => c.id === input.category_id) || null;

  const newProd: ProductWithVariants = {
    id: productId,
    shop_id: input.shop_id,
    name: input.name.trim(),
    company: input.company?.trim() || null,
    category_id: input.category_id || null,
    category: cat,
    created_at: new Date().toISOString(),
    variants: input.variants.map((v, i) => ({
      id: `var-${Date.now()}-${i}`,
      product_id: productId,
      variant_name: v.variant_name.trim(),
      pack_quantity: v.pack_quantity ?? null,
      unit: v.unit || null,
      cost_price: v.cost_price,
      selling_price: v.selling_price,
      stock_quantity: v.stock_quantity,
      expiry_date: v.expiry_date || null,
    })),
  };

  const prods = getLocalStore<ProductWithVariants[]>('products', []);
  prods.unshift(newProd);
  setLocalStore('products', prods);
  return newProd;
}

export interface UpdateProductInput {
  id: string;
  name: string;
  company?: string | null;
  category_id?: string | null;
  variants: Array<{
    id?: string;
    variant_name: string;
    pack_quantity?: number | null;
    unit?: string | null;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    expiry_date?: string | null;
  }>;
}

export async function updateProduct(input: UpdateProductInput): Promise<ProductWithVariants> {
  if (isSupabaseConfigured && supabase) {
    const { error: prodErr } = await supabase
      .from('products')
      .update({
        name: input.name.trim(),
        company: input.company?.trim() || null,
        category_id: input.category_id || null,
      })
      .eq('id', input.id);

    if (prodErr) throw new Error(prodErr.message);

    const variantRows = input.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      product_id: input.id,
      variant_name: v.variant_name.trim(),
      pack_quantity: v.pack_quantity ?? null,
      unit: v.unit || null,
      cost_price: v.cost_price,
      selling_price: v.selling_price,
      stock_quantity: v.stock_quantity,
      expiry_date: v.expiry_date || null,
    }));

    const { error: varErr } = await supabase.from('product_variants').upsert(variantRows);
    if (varErr) throw new Error(varErr.message);

    return getProductById(input.id) as Promise<ProductWithVariants>;
  }

  // Local Store Fallback
  const prods = getLocalStore<ProductWithVariants[]>('products', []);
  const idx = prods.findIndex((p) => p.id === input.id);
  if (idx === -1) throw new Error('Product not found');

  const cats = getLocalStore<Category[]>('categories', []);
  const cat = cats.find((c) => c.id === input.category_id) || null;

  const existingVariants = prods[idx].variants;
  const updatedVariants: ProductVariant[] = input.variants.map((v, i) => {
    const existing = v.id ? existingVariants.find((ev) => ev.id === v.id) : null;
    return {
      id: v.id || existing?.id || `var-${Date.now()}-${i}`,
      product_id: input.id,
      variant_name: v.variant_name.trim(),
      pack_quantity: v.pack_quantity ?? null,
      unit: v.unit || null,
      cost_price: v.cost_price,
      selling_price: v.selling_price,
      stock_quantity: v.stock_quantity,
      expiry_date: v.expiry_date || null,
    };
  });

  prods[idx] = {
    ...prods[idx],
    name: input.name.trim(),
    company: input.company?.trim() || null,
    category_id: input.category_id || null,
    category: cat,
    variants: updatedVariants,
  };

  setLocalStore('products', prods);
  return prods[idx];
}

export async function deleteVariant(variantId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('product_variants').delete().eq('id', variantId);
    return;
  }

  const prods = getLocalStore<ProductWithVariants[]>('products', []);
  prods.forEach((p) => {
    p.variants = p.variants.filter((v) => v.id !== variantId);
  });
  setLocalStore('products', prods);
}
