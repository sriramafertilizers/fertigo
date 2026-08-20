'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShop, getProducts, getCategories, getCompanies, createProduct, createCategory, createCompany } from '@/lib/supabase/db';
import { PREDEFINED_UNITS, UnitOption, Company } from '@/lib/types';
import CategoryModal from '@/components/category-modal';
import CompanyModal from '@/components/company-modal';
import { DashRing } from '@/components/loading-ui/dash-ring';
import {
  Package,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  Tag,
  Layers,
  Calendar,
  Box,
  CheckCircle2,
  Building2,
} from 'lucide-react';

interface VariantRow {
  id: string;
  variant_name: string;
  pack_quantity: string;
  unit: UnitOption;
  cost_price: string;
  selling_price: string;
  stock_quantity: string;
  expiry_date: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [productName, setProductName] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Product Type: 'SINGLE' for standard items (e.g. Urea 45kg Bag) vs 'MULTIPLE' (e.g. Minolite 250ml/500ml)
  const [productType, setProductType] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');

  // Single Product Fields
  const [singlePackQty, setSinglePackQty] = useState('45');
  const [singleUnit, setSingleUnit] = useState<UnitOption>('kg');
  const [singleCostPrice, setSingleCostPrice] = useState('');
  const [singleSellingPrice, setSingleSellingPrice] = useState('');
  const [singleStock, setSingleStock] = useState('0');
  const [singleExpiry, setSingleExpiry] = useState('');

  // Multiple Variants Fields
  const [variants, setVariants] = useState<VariantRow[]>([
    {
      id: 'v1',
      variant_name: '500 ml',
      pack_quantity: '500',
      unit: 'ml',
      cost_price: '220',
      selling_price: '275',
      stock_quantity: '10',
      expiry_date: '',
    },
    {
      id: 'v2',
      variant_name: '1 L',
      pack_quantity: '1',
      unit: 'L',
      cost_price: '420',
      selling_price: '500',
      stock_quantity: '15',
      expiry_date: '',
    },
  ]);

  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', shop?.id],
    queryFn: () => (shop?.id ? getCategories(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', shop?.id],
    queryFn: () => (shop?.id ? getCompanies(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: existingProducts = [] } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: () => (shop?.id ? getProducts(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const handleAddVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        variant_name: '1 L',
        pack_quantity: '1',
        unit: 'L',
        cost_price: '0',
        selling_price: '0',
        stock_quantity: '0',
        expiry_date: '',
      },
    ]);
  };

  const handleRemoveVariantRow = (id: string) => {
    if (variants.length <= 1) {
      setFormError('Product must have at least one pack size variant.');
      return;
    }
    setFormError(null);
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const updateVariantRow = (id: string, field: keyof VariantRow, value: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, [field]: value };
        if (field === 'pack_quantity' || field === 'unit') {
          const qty = field === 'pack_quantity' ? value : v.pack_quantity;
          const u = field === 'unit' ? value : v.unit;
          if (qty && u) {
            updated.variant_name = `${qty} ${u}`;
          }
        }
        return updated;
      })
    );
  };

  const handleAddCategory = async (newCatName: string) => {
    if (!shop?.id) return;
    const newCat = await createCategory(shop.id, newCatName);
    queryClient.invalidateQueries({ queryKey: ['categories', shop.id] });
    setCategoryId(newCat.id);
  };

  const handleAddCompany = async (companyData: Omit<Company, 'id' | 'shop_id' | 'created_at'>) => {
    if (!shop?.id) throw new Error('Shop not active');
    const newComp = await createCompany(shop.id, companyData);
    queryClient.invalidateQueries({ queryKey: ['companies', shop.id] });
    setSelectedCompanyId(newComp.id);
    return newComp;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!shop?.id) throw new Error('Shop not found');
      if (!productName.trim()) throw new Error('Product name is required');

      let companyName: string | null = null;
      let companyId: string | null = null;

      if (selectedCompanyId === 'OTHER') {
        companyName = customCompanyName.trim() || null;
      } else if (selectedCompanyId) {
        const found = companies.find((c) => c.id === selectedCompanyId);
        if (found) {
          companyId = found.id;
          companyName = found.name;
        }
      }

      let parsedVariants = [];

      if (productType === 'SINGLE') {
        const cost = parseFloat(singleCostPrice || '0');
        const selling = parseFloat(singleSellingPrice || '0');
        const stock = parseFloat(singleStock || '0');
        const qty = singlePackQty ? parseFloat(singlePackQty) : null;

        if (isNaN(cost) || cost < 0) throw new Error('Cost price cannot be negative');
        if (isNaN(selling) || selling < 0) throw new Error('Selling price cannot be negative');
        if (isNaN(stock) || stock < 0) throw new Error('Stock quantity cannot be negative');

        const label = qty && singleUnit ? `${singlePackQty} ${singleUnit}` : 'Standard Pack';

        parsedVariants = [
          {
            variant_name: label,
            pack_quantity: qty,
            unit: singleUnit,
            cost_price: cost,
            selling_price: selling,
            stock_quantity: stock,
            expiry_date: singleExpiry || null,
          },
        ];
      } else {
        if (variants.length === 0) throw new Error('At least one pack size is required');
        parsedVariants = variants.map((v) => {
          const cost = parseFloat(v.cost_price || '0');
          const selling = parseFloat(v.selling_price || '0');
          const stock = parseFloat(v.stock_quantity || '0');
          const qty = v.pack_quantity ? parseFloat(v.pack_quantity) : null;

          if (isNaN(cost) || cost < 0) throw new Error(`Cost price for "${v.variant_name}" cannot be negative`);
          if (isNaN(selling) || selling < 0) throw new Error(`Selling price for "${v.variant_name}" cannot be negative`);
          if (isNaN(stock) || stock < 0) throw new Error(`Stock quantity for "${v.variant_name}" cannot be negative`);

          return {
            variant_name: v.variant_name.trim() || `${v.pack_quantity || ''} ${v.unit}`.trim(),
            pack_quantity: qty,
            unit: v.unit,
            cost_price: cost,
            selling_price: selling,
            stock_quantity: stock,
            expiry_date: v.expiry_date || null,
          };
        });
      }

      return createProduct({
        shop_id: shop.id,
        name: productName.trim(),
        company: companyName,
        company_id: companyId,
        category_id: categoryId || null,
        variants: parsedVariants,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create product');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link & Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Product</h1>
          <p className="text-xs text-slate-500">
            Define product info, select manufacturer company, pricing, stock, and pack variants
          </p>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Basic Product Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Urea 45kg Bag, DAP 50kg Bag, Minolite, Coragen..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900"
              />
            </div>

            {/* Company / Manufacturer Dropdown + New Company Modal */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company / Manufacturer</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Company</span>
                </button>
              </div>

              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="OTHER">+ Other / Unlisted Company</option>
              </select>

              {selectedCompanyId === 'OTHER' && (
                <input
                  type="text"
                  value={customCompanyName}
                  onChange={(e) => setCustomCompanyName(e.target.value)}
                  placeholder="Type company / supplier name..."
                  className="w-full mt-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Category</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Category</span>
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Type Selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-600" />
                <span>Pricing & Pack Sizes</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Is this a single standard product (e.g. Urea Bag) or does it have multiple pack sizes (e.g. Minolite)?
              </p>
            </div>

            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setProductType('SINGLE')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  productType === 'SINGLE'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single Product (1 Item)
              </button>
              <button
                type="button"
                onClick={() => setProductType('MULTIPLE')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  productType === 'MULTIPLE'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Multiple Pack Variants (e.g. 500ml, 1L)
              </button>
            </div>
          </div>

          {/* Form Option 1: Single Product */}
          {productType === 'SINGLE' ? (
            <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Single Product Pricing & Stock</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pack Size & Unit
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={singlePackQty}
                      onChange={(e) => setSinglePackQty(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 bg-white"
                    />
                    <select
                      value={singleUnit}
                      onChange={(e) => setSingleUnit(e.target.value as UnitOption)}
                      className="w-1/2 px-2.5 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 bg-white"
                    >
                      {PREDEFINED_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={singleCostPrice}
                    onChange={(e) => setSingleCostPrice(e.target.value)}
                    placeholder="e.g. 242.00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={singleSellingPrice}
                    onChange={(e) => setSingleSellingPrice(e.target.value)}
                    placeholder="e.g. 266.50"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={singleStock}
                    onChange={(e) => setSingleStock(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-bold text-emerald-800 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expiry Date <span className="text-slate-400 font-normal">(Optional)</span></span>
                  </label>
                  <input
                    type="date"
                    value={singleExpiry}
                    onChange={(e) => setSingleExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Form Option 2: Multiple Pack Variants */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Add multiple pack sizes (e.g. 500ml, 1L) with individual prices & stock
                </span>
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Variant</span>
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((v, index) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Variant #{index + 1} — {v.variant_name}</span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(v.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove Variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={v.pack_quantity}
                          onChange={(e) => updateVariantRow(v.id, 'pack_quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-mono text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Unit
                        </label>
                        <select
                          value={v.unit}
                          onChange={(e) => updateVariantRow(v.id, 'unit', e.target.value as UnitOption)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-medium text-slate-900 bg-white"
                        >
                          {PREDEFINED_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={v.variant_name}
                          onChange={(e) => updateVariantRow(v.id, 'variant_name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cost (₹)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={v.cost_price}
                          onChange={(e) => updateVariantRow(v.id, 'cost_price', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-mono text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Selling (₹)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={v.selling_price}
                          onChange={(e) => updateVariantRow(v.id, 'selling_price', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-mono font-bold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Stock
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={v.stock_quantity}
                          onChange={(e) => updateVariantRow(v.id, 'stock_quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-mono font-bold text-emerald-800 bg-white"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Expiry Date</span>
                        </label>
                        <input
                          type="date"
                          value={v.expiry_date}
                          onChange={(e) => updateVariantRow(v.id, 'expiry_date', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/products"
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {createMutation.isPending ? (
              <>
                <DashRing size={18} className="text-white" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Product</span>
              </>
            )}
          </button>
        </div>
      </form>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />

      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onAddCompany={handleAddCompany}
      />
    </div>
  );
}
