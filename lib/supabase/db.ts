import { Shop, Category, Company, Product, ProductVariant, ProductWithVariants, User, PREDEFINED_CATEGORIES, Sale, SaleItem, SaleWithItems, CreateSaleInput, Customer, Farmer, KathaPayment, FarmerWithHistory } from '../types';
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
// COMPANIES / MANUFACTURERS API
// ----------------------------------------------------
export async function getCompanies(shopId: string): Promise<Company[]> {
  if (!shopId) return [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('shop_id', shopId)
        .order('name');
      if (!error && data) return data;
    } catch {
      // ignore
    }
  }
  const companies = getLocalStore<Company[]>('companies', []);
  return companies.filter((c) => c.shop_id === shopId);
}

export async function createCompany(
  shopId: string,
  companyData: Omit<Company, 'id' | 'shop_id' | 'created_at'>
): Promise<Company> {
  const cleanName = companyData.name.trim();
  if (!cleanName) throw new Error('Company name is required');

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          shop_id: shopId,
          name: cleanName,
          contact_person: companyData.contact_person?.trim() || null,
          phone: companyData.phone?.trim() || null,
          account_number: companyData.account_number?.trim() || null,
          bank_name: companyData.bank_name?.trim() || null,
          ifsc_code: companyData.ifsc_code?.trim() || null,
          gstin: companyData.gstin?.trim() || null,
          address: companyData.address?.trim() || null,
        })
        .select()
        .single();

      if (!error && data) return data;
    } catch {
      // fallback
    }
  }

  const companies = getLocalStore<Company[]>('companies', []);
  const newCompany: Company = {
    id: `comp-${Date.now()}`,
    shop_id: shopId,
    name: cleanName,
    contact_person: companyData.contact_person?.trim() || null,
    phone: companyData.phone?.trim() || null,
    account_number: companyData.account_number?.trim() || null,
    bank_name: companyData.bank_name?.trim() || null,
    ifsc_code: companyData.ifsc_code?.trim() || null,
    gstin: companyData.gstin?.trim() || null,
    address: companyData.address?.trim() || null,
    created_at: new Date().toISOString(),
  };

  companies.push(newCompany);
  setLocalStore('companies', companies);
  return newCompany;
}

export async function updateCompany(company: Partial<Company> & { id: string }): Promise<Company> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', company.id)
        .select()
        .single();
      if (!error && data) return data;
    } catch {
      // ignore
    }
  }
  const companies = getLocalStore<Company[]>('companies', []);
  const idx = companies.findIndex((c) => c.id === company.id);
  const updated = { ...companies[idx], ...company };
  if (idx >= 0) companies[idx] = updated;
  setLocalStore('companies', companies);
  return updated as Company;
}

export async function deleteCompany(companyId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('companies').delete().eq('id', companyId);
      return;
    } catch {
      // ignore
    }
  }
  const companies = getLocalStore<Company[]>('companies', []);
  const updatedCompanies = companies.filter((c) => c.id !== companyId);
  setLocalStore('companies', updatedCompanies);
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

    if (!error && data) {
      try {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('shop_id', shopId);

        const companyMap = new Map((companyData || []).map((c) => [c.id, c]));

        const enriched = data.map((p: any) => ({
          ...p,
          company_obj: p.company_id ? companyMap.get(p.company_id) || null : null,
        }));

        return enriched as ProductWithVariants[];
      } catch {
        return data as ProductWithVariants[];
      }
    }
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

    if (!error && data) {
      if (data.company_id) {
        try {
          const { data: comp } = await supabase
            .from('companies')
            .select('*')
            .eq('id', data.company_id)
            .single();
          if (comp) {
            (data as any).company_obj = comp;
          }
        } catch {
          // ignore
        }
      }
      return data as ProductWithVariants;
    }
  }
  const prods = getLocalStore<ProductWithVariants[]>('products', []);
  return prods.find((p) => p.id === id) || null;
}

export interface CreateProductInput {
  shop_id: string;
  name: string;
  company?: string | null;
  company_id?: string | null;
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
    const insertPayload: any = {
      id: productId,
      shop_id: input.shop_id,
      name: input.name.trim(),
      company: input.company?.trim() || null,
      category_id: input.category_id || null,
    };
    if (input.company_id) {
      insertPayload.company_id = input.company_id;
    }

    let { data: prodData, error: prodErr } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    if (prodErr && prodErr.message.includes('company_id')) {
      delete insertPayload.company_id;
      const retry = await supabase
        .from('products')
        .insert(insertPayload)
        .select()
        .single();
      prodData = retry.data;
      prodErr = retry.error;
    }

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

  const comps = getLocalStore<Company[]>('companies', []);
  const comp = comps.find((c) => c.id === input.company_id) || null;

  const newProd: ProductWithVariants = {
    id: productId,
    shop_id: input.shop_id,
    name: input.name.trim(),
    company: input.company?.trim() || comp?.name || null,
    company_id: input.company_id || null,
    company_obj: comp,
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
  company_id?: string | null;
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
    const updatePayload: any = {
      name: input.name.trim(),
      company: input.company?.trim() || null,
      category_id: input.category_id || null,
    };
    if (input.company_id) {
      updatePayload.company_id = input.company_id;
    }

    let { error: prodErr } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', input.id);

    if (prodErr && prodErr.message.includes('company_id')) {
      delete updatePayload.company_id;
      const retry = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', input.id);
      prodErr = retry.error;
    }

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

  const comps = getLocalStore<Company[]>('companies', []);
  const comp = comps.find((c) => c.id === input.company_id) || null;

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
    company: input.company?.trim() || comp?.name || null,
    company_id: input.company_id || null,
    company_obj: comp,
    category_id: input.category_id || null,
    category: cat,
    variants: updatedVariants,
  };

  setLocalStore('products', prods);
  return prods[idx];
}

export async function deleteProduct(productId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw new Error(error.message);
    return;
  }

  const prods = getLocalStore<ProductWithVariants[]>('products', []);
  const updatedProds = prods.filter((p) => p.id !== productId);
  setLocalStore('products', updatedProds);
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

// ----------------------------------------------------
// FARMER SALES & POS BILLING API (Real-Time Stock Deduction)
// ----------------------------------------------------
export async function createSale(input: CreateSaleInput): Promise<SaleWithItems> {
  if (!input.shop_id) throw new Error('Shop ID is required.');
  if (!input.customer_name.trim()) throw new Error('Farmer / Customer name is required.');
  if (!input.items || input.items.length === 0) throw new Error('Sale must contain at least 1 item.');

  const saleId = crypto.randomUUID();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const billNumber = `INV-${dateStr}-${randomSuffix}`;

  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const discount = input.discount_amount || 0;
  const netAmount = Math.max(0, totalAmount - discount);
  const paymentMode = input.payment_mode || 'CASH';

  const saleRecord: Sale = {
    id: saleId,
    shop_id: input.shop_id,
    bill_number: billNumber,
    farmer_id: input.farmer_id || null,
    customer_name: input.customer_name.trim(),
    customer_mobile: input.customer_mobile?.trim() || null,
    total_amount: totalAmount,
    discount_amount: discount,
    net_amount: netAmount,
    payment_mode: paymentMode,
    created_at: new Date().toISOString(),
  };

  const saleItems: SaleItem[] = input.items.map((item) => ({
    id: crypto.randomUUID(),
    sale_id: saleId,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product_name,
    variant_name: item.variant_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
    created_at: new Date().toISOString(),
  }));

  // Perform Stock Deduction
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Save Sale Header
      const { error: saleErr } = await supabase.from('sales').insert({
        id: saleRecord.id,
        shop_id: saleRecord.shop_id,
        bill_number: saleRecord.bill_number,
        farmer_id: saleRecord.farmer_id || null,
        customer_name: saleRecord.customer_name,
        customer_mobile: saleRecord.customer_mobile,
        total_amount: saleRecord.total_amount,
        discount_amount: saleRecord.discount_amount,
        net_amount: saleRecord.net_amount,
        payment_mode: saleRecord.payment_mode,
      });

      if (!saleErr) {
        // 2. Save Sale Line Items
        const itemRows = saleItems.map((si) => ({
          id: si.id,
          sale_id: si.sale_id,
          product_id: si.product_id,
          variant_id: si.variant_id,
          product_name: si.product_name,
          variant_name: si.variant_name,
          quantity: si.quantity,
          unit_price: si.unit_price,
          total_price: si.total_price,
        }));
        await supabase.from('sale_items').insert(itemRows);

        // 3. Deduct Stock for each variant in Supabase
        for (const item of input.items) {
          const { data: vData } = await supabase
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', item.variant_id)
            .single();

          if (vData) {
            const currentStock = Number(vData.stock_quantity || 0);
            const newStock = Math.max(0, currentStock - item.quantity);
            await supabase
              .from('product_variants')
              .update({ stock_quantity: newStock })
              .eq('id', item.variant_id);
          }
        }

        // 4. If Katha (CREDIT) and farmer linked — increase farmer's katha_balance
        if (paymentMode === 'CREDIT' && saleRecord.farmer_id) {
          const { data: farmerRow } = await supabase
            .from('farmers')
            .select('katha_balance')
            .eq('id', saleRecord.farmer_id)
            .single();

          if (farmerRow) {
            const newKatha = Number(farmerRow.katha_balance || 0) + netAmount;
            await supabase
              .from('farmers')
              .update({ katha_balance: newKatha })
              .eq('id', saleRecord.farmer_id);
          }
        }
      }
    } catch {
      // fallback
    }
  }

  // Always update Local Store as well for real-time synchronization
  const sales = getLocalStore<Sale[]>('sales', []);
  sales.unshift(saleRecord);
  setLocalStore('sales', sales);

  const allSaleItems = getLocalStore<SaleItem[]>('sale_items', []);
  setLocalStore('sale_items', [...saleItems, ...allSaleItems]);

  // Local Store Stock Deduction Fallback
  const prods = getLocalStore<ProductWithVariants[]>('products', []);
  input.items.forEach((item) => {
    prods.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.id === item.variant_id) {
          const currentStock = Number(v.stock_quantity || 0);
          v.stock_quantity = Math.max(0, currentStock - item.quantity);
        }
      });
    });
  });
  setLocalStore('products', prods);

  // Local Store Katha balance fallback for CREDIT sales
  if (paymentMode === 'CREDIT' && saleRecord.farmer_id) {
    const farmers = getLocalStore<Farmer[]>('farmers', []);
    const fi = farmers.findIndex((f) => f.id === saleRecord.farmer_id);
    if (fi >= 0) {
      farmers[fi].katha_balance = Number(farmers[fi].katha_balance || 0) + netAmount;
      setLocalStore('farmers', farmers);
    }
  }

  return {
    ...saleRecord,
    items: saleItems,
  };
}

export async function getSales(shopId: string): Promise<SaleWithItems[]> {
  if (!shopId) return [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          items:sale_items(*)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (!error && data) return data as SaleWithItems[];
    } catch {
      // fallback
    }
  }

  const sales = getLocalStore<Sale[]>('sales', []);
  const shopSales = sales.filter((s) => s.shop_id === shopId);

  const allItems = getLocalStore<SaleItem[]>('sale_items', []);

  return shopSales.map((s) => ({
    ...s,
    items: allItems.filter((i) => i.sale_id === s.id),
  }));
}

export async function deleteSale(saleId: string): Promise<void> {
  if (!saleId) return;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: sale } = await supabase
        .from('sales')
        .select('*, items:sale_items(*)')
        .eq('id', saleId)
        .single();

      if (sale) {
        // Restore inventory stock
        for (const item of (sale.items || [])) {
          if (item.variant_id) {
            const { data: variant } = await supabase
              .from('product_variants')
              .select('stock_quantity')
              .eq('id', item.variant_id)
              .single();

            if (variant) {
              await supabase
                .from('product_variants')
                .update({ stock_quantity: Number(variant.stock_quantity || 0) + Number(item.quantity || 1) })
                .eq('id', item.variant_id);
            }
          }
        }

        // Adjust farmer Katha credit balance
        if (sale.payment_mode === 'CREDIT' && sale.farmer_id) {
          const { data: farmer } = await supabase
            .from('farmers')
            .select('katha_balance')
            .eq('id', sale.farmer_id)
            .single();

          if (farmer) {
            await supabase
              .from('farmers')
              .update({ katha_balance: Math.max(0, Number(farmer.katha_balance || 0) - Number(sale.net_amount || 0)) })
              .eq('id', sale.farmer_id);
          }
        }

        // Delete items and sale record
        await supabase.from('sale_items').delete().eq('sale_id', saleId);
        await supabase.from('sales').delete().eq('id', saleId);
        return;
      }
    } catch {
      // Fallback
    }
  }

  // Local Store Fallback
  const sales = getLocalStore<Sale[]>('sales', []);
  const saleToDelete = sales.find((s) => s.id === saleId);
  const updatedSales = sales.filter((s) => s.id !== saleId);
  setLocalStore('sales', updatedSales);

  const saleItems = getLocalStore<SaleItem[]>('sale_items', []);
  const deletedItems = saleItems.filter((i) => i.sale_id === saleId);
  const updatedItems = saleItems.filter((i) => i.sale_id !== saleId);
  setLocalStore('sale_items', updatedItems);

  if (saleToDelete) {
    const prods = getLocalStore<ProductWithVariants[]>('products', []);
    deletedItems.forEach((item) => {
      prods.forEach((p) => {
        (p.variants || []).forEach((v) => {
          if (v.id === item.variant_id || (v.variant_name === item.variant_name && p.name === item.product_name)) {
            v.stock_quantity = Number(v.stock_quantity || 0) + item.quantity;
          }
        });
      });
    });
    setLocalStore('products', prods);

    if (saleToDelete.payment_mode === 'CREDIT' && saleToDelete.farmer_id) {
      const farmers = getLocalStore<Farmer[]>('farmers', []);
      const fi = farmers.findIndex((f) => f.id === saleToDelete.farmer_id);
      if (fi >= 0) {
        farmers[fi].katha_balance = Math.max(0, Number(farmers[fi].katha_balance || 0) - Number(saleToDelete.net_amount || 0));
        setLocalStore('farmers', farmers);
      }
    }
  }
}

// ----------------------------------------------------
// FARMERS / CUSTOMER REGISTRY API
// ----------------------------------------------------
export async function getFarmers(shopId: string): Promise<Farmer[]> {
  if (!shopId) return [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('shop_id', shopId)
        .order('name');
      if (!error && data) return data as Farmer[];
    } catch {
      // fallback
    }
  }
  const farmers = getLocalStore<Farmer[]>('farmers', []);
  return farmers.filter((f) => f.shop_id === shopId).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFarmerById(farmerId: string): Promise<FarmerWithHistory | null> {
  if (!farmerId) return null;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: farmerData, error } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', farmerId)
        .single();
      if (error || !farmerData) return null;

      const { data: salesData } = await supabase
        .from('sales')
        .select('*, items:sale_items(*)')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      const { data: kathaData } = await supabase
        .from('katha_payments')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      return {
        ...(farmerData as Farmer),
        sales: (salesData as SaleWithItems[]) || [],
        katha_payments: (kathaData as KathaPayment[]) || [],
      };
    } catch {
      // fallback
    }
  }

  // Local Store Fallback
  const farmers = getLocalStore<Farmer[]>('farmers', []);
  const farmer = farmers.find((f) => f.id === farmerId);
  if (!farmer) return null;

  const sales = getLocalStore<Sale[]>('sales', []);
  const saleItems = getLocalStore<SaleItem[]>('sale_items', []);
  const kathaPayments = getLocalStore<KathaPayment[]>('katha_payments', []);

  const farmerSales = sales
    .filter((s) => s.farmer_id === farmerId)
    .map((s) => ({ ...s, items: saleItems.filter((i) => i.sale_id === s.id) }));

  return {
    ...farmer,
    sales: farmerSales,
    katha_payments: kathaPayments.filter((k) => k.farmer_id === farmerId),
  };
}

export async function createFarmer(
  shopId: string,
  data: Omit<Farmer, 'id' | 'shop_id' | 'created_at' | 'katha_balance'>
): Promise<Farmer> {
  const cleanName = data.name.trim();
  if (!cleanName) throw new Error('Farmer name is required');

  const newFarmer: Farmer = {
    id: crypto.randomUUID(),
    shop_id: shopId,
    name: cleanName,
    mobile: data.mobile?.trim() || null,
    aadhar_number: data.aadhar_number?.trim() || null,
    village: data.village?.trim() || null,
    land_acres: data.land_acres ?? null,
    crop_types: data.crop_types?.length ? data.crop_types : null,
    notes: data.notes?.trim() || null,
    katha_balance: 0,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: saved, error } = await supabase
        .from('farmers')
        .insert(newFarmer)
        .select()
        .single();
      if (!error && saved) return saved as Farmer;
    } catch {
      // fallback
    }
  }

  const farmers = getLocalStore<Farmer[]>('farmers', []);
  farmers.push(newFarmer);
  setLocalStore('farmers', farmers);
  return newFarmer;
}

export async function updateFarmer(farmer: Partial<Farmer> & { id: string }): Promise<Farmer> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .update(farmer)
        .eq('id', farmer.id)
        .select()
        .single();
      if (!error && data) return data as Farmer;
    } catch {
      // fallback
    }
  }
  const farmers = getLocalStore<Farmer[]>('farmers', []);
  const idx = farmers.findIndex((f) => f.id === farmer.id);
  const updated = { ...farmers[idx], ...farmer };
  if (idx >= 0) farmers[idx] = updated;
  setLocalStore('farmers', farmers);
  return updated as Farmer;
}

export async function deleteFarmer(farmerId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('farmers').delete().eq('id', farmerId);
      return;
    } catch {
      // fallback
    }
  }
  const farmers = getLocalStore<Farmer[]>('farmers', []);
  setLocalStore('farmers', farmers.filter((f) => f.id !== farmerId));
}

// Record a katha repayment — reduces farmer's katha_balance
export async function recordKathaPayment(
  shopId: string,
  farmerId: string,
  amount: number,
  notes?: string
): Promise<KathaPayment> {
  if (amount <= 0) throw new Error('Payment amount must be greater than 0');

  const payment: KathaPayment = {
    id: crypto.randomUUID(),
    shop_id: shopId,
    farmer_id: farmerId,
    amount,
    notes: notes?.trim() || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: saved, error } = await supabase
        .from('katha_payments')
        .insert(payment)
        .select()
        .single();

      if (!error && saved) {
        // Reduce katha_balance on the farmer row
        const { data: farmerRow } = await supabase
          .from('farmers')
          .select('katha_balance')
          .eq('id', farmerId)
          .single();

        if (farmerRow) {
          const newBalance = Math.max(0, Number(farmerRow.katha_balance) - amount);
          await supabase
            .from('farmers')
            .update({ katha_balance: newBalance })
            .eq('id', farmerId);
        }
        return saved as KathaPayment;
      }
    } catch {
      // fallback
    }
  }

  // Local Store Fallback
  const payments = getLocalStore<KathaPayment[]>('katha_payments', []);
  payments.unshift(payment);
  setLocalStore('katha_payments', payments);

  const farmers = getLocalStore<Farmer[]>('farmers', []);
  const idx = farmers.findIndex((f) => f.id === farmerId);
  if (idx >= 0) {
    farmers[idx].katha_balance = Math.max(0, Number(farmers[idx].katha_balance || 0) - amount);
    setLocalStore('farmers', farmers);
  }
  return payment;
}

