'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getShop, getProducts, getCategories } from '@/lib/supabase/db';
import { ProductWithVariants, ProductVariant } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import { getExpiryStatus } from '@/lib/utils';
import {
  Package,
  Search,
  Filter,
  PlusCircle,
  ChevronRight,
  Tag,
  Layers,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react';

export default function ProductsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: () => (shop?.id ? getProducts(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', shop?.id],
    queryFn: () => (shop?.id ? getCategories(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.company && prod.company.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      prod.category_id === selectedCategory ||
      prod.category?.name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getTotalStock = (variants: ProductWithVariants['variants']) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);
  };

  const renderExpiryBadge = (expiryDateStr?: string | null) => {
    const expiry = getExpiryStatus(expiryDateStr);
    if (expiry.status === 'NONE') {
      return <span className="text-slate-400 text-xs font-normal">OK</span>;
    }
    if (expiry.status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          <span>{expiry.label}</span>
        </span>
      );
    }
    if (expiry.status === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>{expiry.label}</span>
        </span>
      );
    }
    if (expiry.status === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{expiry.label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Calendar className="w-3 h-3 text-emerald-600" />
        <span>{expiry.formattedDate}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Package className="w-4 h-4" />
            <span>Product Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Products Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage agri inputs, pack sizes, costs, selling prices, stock, and expiry dates
          </p>
        </div>

        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>+ Add Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or manufacturer company..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:inline-block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {(searchQuery || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isProductsLoading ? (
        <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <DashRing size={36} />
          <span className="text-sm font-semibold text-slate-700">Loading catalog products...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {products.length === 0
              ? 'Get started by creating the first agricultural product for your shop.'
              : 'No products match your current search or category filter.'}
          </p>
          {products.length === 0 && (
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Product Now</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table: Single products show 1 clean row; Multi-variant products show merged rowspan layout */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="py-3 px-4 border-r border-slate-300 w-1/4">Product & Company</th>
                  <th className="py-3 px-3 border-r border-slate-200 text-center w-12">#</th>
                  <th className="py-3 px-4 border-r border-slate-200">Pack Size / Variant</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-right">Cost Price</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-right">Selling Price</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-right">Stock</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Expiry Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const variants = product.variants || [];
                  const categoryName =
                    product.category?.name ||
                    categories.find((c) => c.id === product.category_id)?.name ||
                    'General';

                  // SINGLE PRODUCT CASE (1 Variant) -> Display as 1 clean standard row!
                  if (variants.length <= 1) {
                    const singleVar = variants[0] || {
                      variant_name: 'Standard Pack',
                      cost_price: 0,
                      selling_price: 0,
                      stock_quantity: 0,
                      expiry_date: null,
                    };

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-50/90 transition-colors border-t border-slate-300"
                      >
                        {/* Product Name & Company */}
                        <td className="py-3.5 px-4 border-r border-slate-300 font-bold text-slate-900">
                          <Link
                            href={`/products/${product.id}`}
                            className="hover:text-emerald-700 block leading-tight text-base"
                          >
                            {product.name}
                          </Link>
                          {product.company && (
                            <span className="text-xs font-semibold text-slate-600 block mt-0.5">
                              {product.company}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mt-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>{categoryName}</span>
                          </span>
                        </td>

                        {/* Item Index # */}
                        <td className="py-3.5 px-3 text-center border-r border-slate-200 font-mono text-xs text-slate-400">
                          1
                        </td>

                        {/* Pack Size */}
                        <td className="py-3.5 px-4 border-r border-slate-200 font-semibold text-slate-900">
                          {singleVar.variant_name || 'Standard Pack'}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3.5 px-4 border-r border-slate-200 text-right font-mono text-xs text-slate-600 tabular-nums">
                          ₹{Number(singleVar.cost_price).toFixed(2)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-4 border-r border-slate-200 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ₹{Number(singleVar.selling_price).toFixed(2)}
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-4 border-r border-slate-200 text-right font-mono font-bold tabular-nums">
                          <span
                            className={
                              Number(singleVar.stock_quantity) > 0 ? 'text-emerald-800' : 'text-red-600'
                            }
                          >
                            {singleVar.stock_quantity}
                          </span>
                        </td>

                        {/* Expiry Status */}
                        <td className="py-3.5 px-4 border-r border-slate-200 text-center">
                          {renderExpiryBadge(singleVar.expiry_date)}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/products/${product.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  }

                  // MULTIPLE VARIANTS CASE (>1 Variants, e.g. Minolite) -> Display using merged rowspan layout!
                  const rowSpan = variants.length;
                  const totalStock = getTotalStock(variants);

                  return variants.map((variant: ProductVariant, index: number) => {
                    const isFirst = index === 0;

                    return (
                      <tr
                        key={variant.id || `${product.id}-${index}`}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          !isFirst ? 'border-t border-slate-200' : 'border-t-2 border-slate-300'
                        }`}
                      >
                        {/* Merged Product Name Cell spanning across all variants */}
                        {isFirst && (
                          <td
                            rowSpan={rowSpan}
                            className="py-4 px-4 border-r border-slate-300 bg-slate-50/50 align-top space-y-2"
                          >
                            <div>
                              <Link
                                href={`/products/${product.id}`}
                                className="font-bold text-base text-slate-900 hover:text-emerald-700 block leading-tight"
                              >
                                {product.name}
                              </Link>
                              {product.company && (
                                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                                  {product.company}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-300">
                                <Tag className="w-3 h-3 text-slate-400" />
                                <span>{categoryName}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Layers className="w-3 h-3 text-emerald-600" />
                                <span>{variants.length} Pack Sizes</span>
                              </span>
                            </div>

                            <div className="pt-2 text-xs font-mono font-bold text-slate-700">
                              Total Stock: <span className="text-emerald-800">{totalStock} units</span>
                            </div>
                          </td>
                        )}

                        {/* Variant Index # (1, 2, 3...) */}
                        <td className="py-3 px-3 text-center border-r border-slate-200 font-mono text-xs font-bold text-slate-600 bg-slate-50/40">
                          {index + 1}
                        </td>

                        {/* Variant Pack Size */}
                        <td className="py-3 px-4 border-r border-slate-200 font-bold text-slate-900">
                          {variant.variant_name}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 border-r border-slate-200 text-right font-mono text-xs text-slate-600 tabular-nums">
                          ₹{Number(variant.cost_price).toFixed(2)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4 border-r border-slate-200 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ₹{Number(variant.selling_price).toFixed(2)}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4 border-r border-slate-200 text-right font-mono font-bold tabular-nums">
                          <span
                            className={
                              Number(variant.stock_quantity) > 0 ? 'text-emerald-800' : 'text-red-600'
                            }
                          >
                            {variant.stock_quantity}
                          </span>
                        </td>

                        {/* Expiry Status */}
                        <td className="py-3 px-4 border-r border-slate-200 text-center">
                          {renderExpiryBadge(variant.expiry_date)}
                        </td>

                        {/* Action (Manage product link on first row) */}
                        {isFirst && (
                          <td
                            rowSpan={rowSpan}
                            className="py-4 px-4 text-center align-top bg-white border-l border-slate-200"
                          >
                            <Link
                              href={`/products/${product.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                            >
                              <span>Manage</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map((product) => {
              const totalStock = getTotalStock(product.variants);
              const categoryName =
                product.category?.name ||
                categories.find((c) => c.id === product.category_id)?.name ||
                'General';

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-4"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <Link href={`/products/${product.id}`} className="font-bold text-lg text-slate-900 leading-tight hover:text-emerald-700">
                        {product.name}
                      </Link>
                      {product.company && (
                        <p className="text-xs text-slate-600 font-semibold mt-0.5">
                          {product.company}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {categoryName}
                    </span>
                  </div>

                  {/* Direct Variant Cards List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Pack Sizes & Pricing ({product.variants?.length || 0})
                    </span>

                    <div className="space-y-2">
                      {product.variants?.map((v: ProductVariant, idx: number) => (
                        <div
                          key={v.id || idx}
                          className="p-3 rounded-lg border-l-4 border-l-emerald-500 bg-slate-50 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                            <div>
                              <span className="font-bold text-slate-900 block text-sm">
                                {v.variant_name}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                Cost: ₹{Number(v.cost_price).toFixed(2)} | Stock: <strong className="text-slate-800">{v.stock_quantity}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <span className="font-mono font-bold text-emerald-800 text-sm block">
                              ₹{Number(v.selling_price).toFixed(2)}
                            </span>
                            <div>{renderExpiryBadge(v.expiry_date)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Total Stock: <strong className="text-emerald-800 font-mono">{totalStock} units</strong>
                    </span>
                    <Link
                      href={`/products/${product.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 text-white text-xs font-bold shadow-xs"
                    >
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
