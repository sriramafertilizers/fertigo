'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShop, getProducts, getFarmers, createSale } from '@/lib/supabase/db';
import { ProductWithVariants, ProductVariant, SaleWithItems, Farmer } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import SaleSuccessModal from '@/components/sale-success-modal';
import {
  Receipt,
  User,
  Phone,
  Search,
  Plus,
  Trash2,
  CreditCard,
  Package,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';

interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  companyName: string;
  variantName: string;
  availableStock: number;
  quantity: number;
  unitPrice: number;
}

export default function BillingPage() {
  const queryClient = useQueryClient();

  // Farmer
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
  const farmerRef = useRef<HTMLDivElement>(null);

  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CREDIT'>('CASH');
  const [discountAmount, setDiscountAmount] = useState('0');

  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [completedSale, setCompletedSale] = useState<SaleWithItems | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: () => (shop?.id ? getProducts(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: farmers = [] } = useQuery({
    queryKey: ['farmers', shop?.id],
    queryFn: () => (shop?.id ? getFarmers(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  // Close farmer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (farmerRef.current && !farmerRef.current.contains(e.target as Node)) {
        setShowFarmerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Farmer autocomplete filter
  const farmerSuggestions = farmers.filter((f) => {
    const q = farmerSearch.toLowerCase();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      (f.mobile && f.mobile.includes(q)) ||
      (f.village && f.village.toLowerCase().includes(q))
    );
  });

  const handleSelectFarmer = (f: Farmer) => {
    setCustomerName(f.name);
    setCustomerMobile(f.mobile || '');
    setSelectedFarmerId(f.id);
    setFarmerSearch(f.name);
    setShowFarmerDropdown(false);
  };

  const handleClearFarmer = () => {
    setCustomerName('');
    setCustomerMobile('');
    setSelectedFarmerId(null);
    setFarmerSearch('');
  };

  // Product search filter
  const searchResults = products.filter((p) => {
    if (!productSearch.trim()) return false;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.company && p.company.toLowerCase().includes(q)) ||
      (p.variants || []).some((v) => v.variant_name.toLowerCase().includes(q))
    );
  });

  const handleAddToCart = (product: ProductWithVariants, variant: ProductVariant) => {
    setErrorMsg(null);
    const existingIdx = cart.findIndex((item) => item.variantId === variant.id);

    if (existingIdx >= 0) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIdx].quantity + 1;
      if (newQty > variant.stock_quantity) {
        setErrorMsg(`Warning: Quantity exceeds current stock (${variant.stock_quantity} available)`);
      }
      updatedCart[existingIdx].quantity = newQty;
      setCart(updatedCart);
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          companyName: product.company || '',
          variantName: variant.variant_name,
          availableStock: Number(variant.stock_quantity || 0),
          quantity: 1,
          unitPrice: Number(variant.selling_price || 0),
        },
      ]);
    }
    setProductSearch('');
  };

  const handleUpdateQty = (variantId: string, qtyStr: string) => {
    const qty = parseFloat(qtyStr || '0');
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, quantity: isNaN(qty) ? 0 : qty } : item
      )
    );
  };

  const handleUpdatePrice = (variantId: string, priceStr: string) => {
    const price = parseFloat(priceStr || '0');
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, unitPrice: isNaN(price) ? 0 : price } : item
      )
    );
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountVal = parseFloat(discountAmount || '0') || 0;
  const netPayable = Math.max(0, cartSubtotal - discountVal);

  const saleMutation = useMutation({
    mutationFn: async () => {
      if (!shop?.id) throw new Error('Shop not active');
      if (!customerName.trim()) throw new Error('Farmer / Customer name is required');
      if (cart.length === 0) throw new Error('Cart is empty. Add at least 1 product.');

      return createSale({
        shop_id: shop.id,
        customer_name: customerName.trim(),
        customer_mobile: customerMobile.trim() || null,
        farmer_id: selectedFarmerId || null,
        discount_amount: discountVal,
        payment_mode: paymentMode,
        items: cart.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          product_name: item.productName,
          variant_name: item.variantName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      });
    },
    onSuccess: (newSale) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      setCompletedSale(newSale);
      setIsSuccessModalOpen(true);
      setCart([]);
      setDiscountAmount('0');
      setCustomerName('');
      setCustomerMobile('');
      setSelectedFarmerId(null);
      setFarmerSearch('');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to complete sale');
    },
  });

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    saleMutation.mutate();
  };

  const paymentLabel = paymentMode === 'CASH' ? 'Cash' : paymentMode === 'UPI' ? 'UPI (PhonePe / GPay)' : 'Katha (Credit)';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Receipt className="w-4 h-4" />
            <span>POS Billing Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Farmer Billing & Sales
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create farmer bills, record purchases, and automatically deduct inventory stock in real time
          </p>
        </div>
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-2xs transition-all"
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>View Sales History</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-medium text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCompleteSale} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Farmer + Product + Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farmer Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-emerald-600" />
              <span>Farmer / Customer Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Farmer Name with Autocomplete */}
              <div className="sm:col-span-1 relative" ref={farmerRef}>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Farmer Name <span className="text-red-500">*</span>
                </label>

                {selectedFarmerId ? (
                  // Farmer selected — show locked chip
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="flex-1 font-bold text-emerald-900 text-sm truncate">{customerName}</span>
                    <button
                      type="button"
                      onClick={handleClearFarmer}
                      className="text-emerald-600 hover:text-red-600 text-xs font-bold cursor-pointer"
                      title="Clear selection"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      value={farmerSearch}
                      onChange={(e) => {
                        setFarmerSearch(e.target.value);
                        setCustomerName(e.target.value);
                        setShowFarmerDropdown(true);
                      }}
                      onFocus={() => setShowFarmerDropdown(true)}
                      placeholder="Search or type farmer name..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900 placeholder:font-normal"
                    />

                    {/* Dropdown */}
                    {showFarmerDropdown && farmerSuggestions.length > 0 && (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          Registered Farmers
                        </div>
                        {farmerSuggestions.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onMouseDown={() => handleSelectFarmer(f)}
                            className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 flex items-center gap-3 cursor-pointer border-b border-slate-50 last:border-0"
                          >
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {f.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-sm truncate">{f.name}</div>
                              <div className="text-[11px] text-slate-500 flex gap-2">
                                {f.mobile && <span className="font-mono">{f.mobile}</span>}
                                {f.village && <span>{f.village}</span>}
                                {Number(f.katha_balance || 0) > 0 && (
                                  <span className="text-amber-700 font-bold">
                                    Katha: ₹{Number(f.katha_balance).toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mobile <span className="text-slate-400 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="text"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  disabled={Boolean(selectedFarmerId)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Payment Mode — Cash / UPI / Katha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Payment Mode</span>
                </label>
                <div className="flex gap-1.5">
                  {(['CASH', 'UPI', 'CREDIT'] as const).map((mode) => {
                    const label = mode === 'CASH' ? 'Cash' : mode === 'UPI' ? 'UPI' : 'Katha';
                    const active = paymentMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                          active
                            ? mode === 'CREDIT'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {paymentMode === 'CREDIT' && (
                  <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                    ⚠️ This will add to the farmer's Katha balance
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-4.5 h-4.5 text-emerald-600" />
                <span>Search & Add Product Items</span>
              </span>
              <span className="text-xs font-normal text-slate-500">Click any item to add to bill cart</span>
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search catalog by product name (e.g. Urea, Minolite, Coragen)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            {productSearch.trim() && (
              <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 max-h-60 overflow-y-auto space-y-2">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No products found matching &ldquo;{productSearch}&rdquo;
                  </div>
                ) : (
                  searchResults.map((prod) => (
                    <div key={prod.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{prod.name}</span>
                        {prod.company && (
                          <span className="text-xs text-slate-500 font-semibold block">{prod.company}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prod.variants?.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleAddToCart(prod, v)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-xs font-bold text-emerald-900 transition-all cursor-pointer shadow-2xs group"
                          >
                            <span>{v.variant_name}</span>
                            <span className="font-mono opacity-80">₹{Number(v.selling_price).toFixed(2)}</span>
                            <span className="text-[10px] px-1.5 rounded bg-white text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white border border-emerald-200 font-mono">
                              Stock: {v.stock_quantity}
                            </span>
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4.5 h-4.5 text-emerald-600" />
                <span>Selected Bill Items ({cart.length})</span>
              </span>
              {cart.length > 0 && (
                <button type="button" onClick={() => setCart([])} className="text-xs text-red-600 hover:underline font-semibold cursor-pointer">
                  Clear Cart
                </button>
              )}
            </h2>

            {cart.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No items added yet</p>
                <p className="text-[11px] text-slate-400">Search products above to add them to this bill</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Product Item</th>
                      <th className="py-2.5 px-3 text-center">Stock</th>
                      <th className="py-2.5 px-3 text-center w-24">Qty</th>
                      <th className="py-2.5 px-3 text-right w-28">Price (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item) => {
                      const itemTotal = item.quantity * item.unitPrice;
                      const isLowStock = item.quantity > item.availableStock;
                      return (
                        <tr key={item.variantId} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block text-sm">{item.productName}</span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {item.variantName} {item.companyName ? `(${item.companyName})` : ''}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold">
                            <span className={isLowStock ? 'text-red-600 font-bold' : 'text-emerald-800'}>
                              {item.availableStock}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              step="any"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQty(item.variantId, e.target.value)}
                              className="w-20 px-2 py-1 rounded border border-slate-300 text-center font-mono font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdatePrice(item.variantId, e.target.value)}
                              className="w-24 px-2 py-1 rounded border border-slate-300 text-right font-mono font-bold text-slate-900 bg-white"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums text-sm">
                            ₹{itemTotal.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.variantId)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 sticky top-20">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
              <span>Bill Summary</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Items</span>
                <span className="font-bold text-slate-900 font-mono">{cart.length} line items</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 font-mono">₹{cartSubtotal.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-600 font-semibold mb-1">Discount (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Net Amount Payable</span>
                  <span className="text-2xl font-bold text-emerald-800 font-mono tabular-nums">
                    ₹{netPayable.toFixed(2)}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${paymentMode === 'CREDIT' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                  {paymentMode === 'CREDIT' ? 'Katha' : paymentMode}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saleMutation.isPending || cart.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {saleMutation.isPending ? (
                <>
                  <DashRing size={20} className="text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Sale & Deduct Stock</span>
                </>
              )}
            </button>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Real-Time Inventory Update:</span>
              <p>Stock is deducted for each item. Katha sales are added to the farmer's balance.</p>
            </div>
          </div>
        </div>
      </form>

      <SaleSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        sale={completedSale}
      />
    </div>
  );
}
