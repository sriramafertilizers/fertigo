'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductById, getCategories, updateProduct, deleteProduct, deleteVariant, createCategory } from '@/lib/supabase/db';
import { PREDEFINED_UNITS, UnitOption } from '@/lib/types';
import CategoryModal from '@/components/category-modal';
import { DashRing } from '@/components/loading-ui/dash-ring';
import { getExpiryStatus } from '@/lib/utils';
import {
  Package,
  ArrowLeft,
  Edit2,
  Save,
  Plus,
  Trash2,
  Tag,
  Layers,
  AlertTriangle,
  CheckCircle2,
  X,
  Calendar,
  Clock,
} from 'lucide-react';

interface EditableVariantRow {
  id?: string;
  variant_name: string;
  pack_quantity: string;
  unit: UnitOption;
  cost_price: string;
  selling_price: string;
  stock_quantity: string;
  expiry_date: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [company, setCompany] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variants, setVariants] = useState<EditableVariantRow[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: product, isLoading: isProductLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductById(productId),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', product?.shop_id],
    queryFn: () => (product?.shop_id ? getCategories(product.shop_id) : Promise.resolve([])),
    enabled: Boolean(product?.shop_id),
  });

  useEffect(() => {
    if (product) {
      setProductName(product.name);
      setCompany(product.company || '');
      setCategoryId(product.category_id || '');
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          variant_name: v.variant_name,
          pack_quantity: v.pack_quantity !== null ? String(v.pack_quantity) : '',
          unit: (v.unit as UnitOption) || 'ml',
          cost_price: String(v.cost_price),
          selling_price: String(v.selling_price),
          stock_quantity: String(v.stock_quantity),
          expiry_date: v.expiry_date || '',
        }))
      );
    }
  }, [product]);

  const handleAddVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
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

  const handleRemoveVariantRow = async (index: number) => {
    const target = variants[index];
    if (variants.length <= 1) {
      setErrorMsg('Product must have at least one variant.');
      return;
    }

    if (target.id) {
      try {
        await deleteVariant(target.id);
      } catch (err: any) {
        setErrorMsg('Failed to delete variant.');
        return;
      }
    }

    setVariants((prev) => prev.filter((_, i) => i !== index));
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };

  const updateVariantField = (index: number, field: keyof EditableVariantRow, value: string) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
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
    if (!product?.shop_id) return;
    const newCat = await createCategory(product.shop_id, newCatName);
    queryClient.invalidateQueries({ queryKey: ['categories', product.shop_id] });
    setCategoryId(newCat.id);
  };

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!productName.trim()) throw new Error('Product name is required');
      if (variants.length === 0) throw new Error('Product must have at least one variant');

      const parsedVariants = variants.map((v) => {
        const cost = parseFloat(v.cost_price || '0');
        const selling = parseFloat(v.selling_price || '0');
        const stock = parseFloat(v.stock_quantity || '0');
        const qty = v.pack_quantity ? parseFloat(v.pack_quantity) : null;

        if (isNaN(cost) || cost < 0) throw new Error(`Invalid cost price for "${v.variant_name}"`);
        if (isNaN(selling) || selling < 0) throw new Error(`Invalid selling price for "${v.variant_name}"`);
        if (isNaN(stock) || stock < 0) throw new Error(`Invalid stock quantity for "${v.variant_name}"`);

        return {
          id: v.id,
          variant_name: v.variant_name.trim() || `${v.pack_quantity || ''} ${v.unit}`.trim(),
          pack_quantity: qty,
          unit: v.unit,
          cost_price: cost,
          selling_price: selling,
          stock_quantity: stock,
          expiry_date: v.expiry_date || null,
        };
      });

      return updateProduct({
        id: productId,
        name: productName.trim(),
        company: company.trim() || null,
        category_id: categoryId || null,
        variants: parsedVariants,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditing(false);
      setSuccessMsg('Product details updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update product');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to delete product.');
      setIsDeleteModalOpen(false);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    updateMutation.mutate();
  };

  if (isProductLoading) {
    return (
      <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 max-w-4xl mx-auto">
        <DashRing size={36} />
        <span className="text-sm font-semibold text-slate-700">Loading product details...</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-4 max-w-4xl mx-auto">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested product ID could not be found or has been removed.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const categoryName =
    product.category?.name || categories.find((c) => c.id === product.category_id)?.name || 'General';

  const totalStock = product.variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5" />
              <span>{categoryName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
              {product.name}
            </h1>
            {product.company && (
              <p className="text-xs text-slate-500 font-medium">
                Manufacturer: <span className="text-slate-800 font-semibold">{product.company}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                setProductName(product.name);
                setCompany(product.company || '');
                setCategoryId(product.category_id || '');
              } else {
                setIsEditing(true);
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              isEditing
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            <span>{isEditing ? 'Cancel Editing' : 'Edit Product'}</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs transition-colors cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Basic Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Product Details</span>
          </h2>

          {isEditing ? (
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
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Manufacturer
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
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
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
              <div>
                <span className="text-xs text-slate-500 block uppercase font-sans">
                  Product Name
                </span>
                <span className="font-bold text-slate-900 text-base">{product.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-sans">
                  Company
                </span>
                <span className="font-semibold text-slate-800 text-sm">
                  {product.company || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-sans">
                  Category
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mt-0.5">
                  {categoryName}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-sans">
                  Total Stock Units
                </span>
                <span className="font-mono font-bold text-emerald-800 text-base">
                  {totalStock}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Pack Sizes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Pack Sizes, Pricing & Expiry ({product.variants.length})
              </h2>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Pack Variant</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              {variants.map((v, index) => (
                <div
                  key={v.id || index}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Variant #{index + 1} — {v.variant_name}</span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantRow(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete Variant"
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
                        onChange={(e) => updateVariantField(index, 'pack_quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-sm font-mono text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Unit
                      </label>
                      <select
                        value={v.unit}
                        onChange={(e) =>
                          updateVariantField(index, 'unit', e.target.value as UnitOption)
                        }
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
                        onChange={(e) => updateVariantField(index, 'variant_name', e.target.value)}
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
                        onChange={(e) => updateVariantField(index, 'cost_price', e.target.value)}
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
                        onChange={(e) => updateVariantField(index, 'selling_price', e.target.value)}
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
                        onChange={(e) => updateVariantField(index, 'stock_quantity', e.target.value)}
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
                        onChange={(e) => updateVariantField(index, 'expiry_date', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Pack Size / Variant</th>
                    <th className="py-2.5 px-3 text-right">Cost Price</th>
                    <th className="py-2.5 px-3 text-right">Selling Price</th>
                    <th className="py-2.5 px-3 text-right">Margin / Unit</th>
                    <th className="py-2.5 px-3 text-right">In Stock</th>
                    <th className="py-2.5 px-3 text-right">Expiry Countdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {product.variants.map((v) => {
                    const margin = Number(v.selling_price || 0) - Number(v.cost_price || 0);
                    const expiry = getExpiryStatus(v.expiry_date);

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {v.variant_name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                          ₹{Number(v.cost_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ₹{Number(v.selling_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs font-medium tabular-nums">
                          <span
                            className={margin >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600'}
                          >
                            +₹{margin.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                          <span
                            className={
                              Number(v.stock_quantity) > 0 ? 'text-emerald-800' : 'text-amber-600'
                            }
                          >
                            {v.stock_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs font-medium">
                          {expiry.status === 'NONE' ? (
                            <span className="text-slate-400 font-normal">Not Set</span>
                          ) : expiry.status === 'EXPIRED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              <span>{expiry.label}</span>
                            </span>
                          ) : expiry.status === 'CRITICAL' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>{expiry.label}</span>
                            </span>
                          ) : expiry.status === 'WARNING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{expiry.label}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                              <Calendar className="w-3 h-3 text-emerald-600" />
                              <span>{expiry.formattedDate}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Save Bar */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {updateMutation.isPending ? (
                <>
                  <DashRing size={18} className="text-white" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Product Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Confirmation Modal for Delete Product */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete <span className="font-bold text-slate-900">&ldquo;{product.name}&rdquo;</span>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              This action will permanently delete <span className="font-semibold text-slate-800">{product.name}</span> and all associated pack sizes. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <>
                    <DashRing size={16} className="text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />
    </div>
  );
}
