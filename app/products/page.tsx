'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getShop, getProducts, getCategories } from '@/lib/supabase/db';
import { ProductWithVariants, ProductVariant } from '@/lib/types';
import ProductCard from '@/components/product-card';
import FilterDrawer, { FilterOptions } from '@/components/filter-drawer';
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
  Plus,
  SlidersHorizontal,
} from 'lucide-react';

export default function ProductsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'ALL',
    stockStatus: 'ALL',
    expiryStatus: 'ALL',
    sortBy: 'NAME_ASC',
  });

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

  // Calculate filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        // Search Filter (Name or Company)
        const matchesSearch =
          !searchQuery ||
          prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (prod.company && prod.company.toLowerCase().includes(searchQuery.toLowerCase()));

        // Category Filter
        const matchesCategory =
          filters.category === 'ALL' ||
          prod.category_id === filters.category ||
          prod.category?.name === filters.category;

        // Total stock of product
        const totalStock = (prod.variants || []).reduce(
          (sum, v) => sum + Number(v.stock_quantity || 0),
          0
        );

        // Stock Status Filter
        let matchesStock = true;
        if (filters.stockStatus === 'HEALTHY') matchesStock = totalStock > 10;
        else if (filters.stockStatus === 'LOW') matchesStock = totalStock > 0 && totalStock <= 10;
        else if (filters.stockStatus === 'OUT_OF_STOCK') matchesStock = totalStock <= 0;

        // Expiry Status Filter
        let matchesExpiry = true;
        if (filters.expiryStatus !== 'ALL') {
          const hasMatchingExpiry = (prod.variants || []).some((v) => {
            const exp = getExpiryStatus(v.expiry_date);
            if (filters.expiryStatus === 'EXPIRED') return exp.status === 'EXPIRED';
            if (filters.expiryStatus === 'EXPIRING_SOON')
              return exp.status === 'CRITICAL' || exp.status === 'WARNING';
            if (filters.expiryStatus === 'OK')
              return exp.status === 'GOOD' || exp.status === 'NONE';
            return true;
          });
          matchesExpiry = hasMatchingExpiry;
        }

        return matchesSearch && matchesCategory && matchesStock && matchesExpiry;
      })
      .sort((a, b) => {
        const aStock = (a.variants || []).reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);
        const bStock = (b.variants || []).reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);

        const aMinPrice = Math.min(...(a.variants || []).map((v) => Number(v.selling_price || 0)), 0);
        const bMinPrice = Math.min(...(b.variants || []).map((v) => Number(v.selling_price || 0)), 0);

        if (filters.sortBy === 'STOCK_DESC') return bStock - aStock;
        if (filters.sortBy === 'STOCK_ASC') return aStock - bStock;
        if (filters.sortBy === 'PRICE_ASC') return aMinPrice - bMinPrice;
        if (filters.sortBy === 'PRICE_DESC') return bMinPrice - aMinPrice;

        // Default: NAME_ASC
        return a.name.localeCompare(b.name);
      });
  }, [products, searchQuery, filters]);

  const activeFilterCount =
    (filters.category !== 'ALL' ? 1 : 0) +
    (filters.stockStatus !== 'ALL' ? 1 : 0) +
    (filters.expiryStatus !== 'ALL' ? 1 : 0) +
    (filters.sortBy !== 'NAME_ASC' ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilters({
      category: 'ALL',
      stockStatus: 'ALL',
      expiryStatus: 'ALL',
      sortBy: 'NAME_ASC',
    });
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
    if (expiry.status === 'CRITICAL' || expiry.status === 'WARNING') {
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
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden">
      
      {/* Tablet-First Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Package className="w-4 h-4 shrink-0" />
            <span>Product Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 truncate">
            Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block truncate">
            Manage agri inputs, pack sizes, costs, selling prices, stock, and expiry dates
          </p>
        </div>

        {/* Primary Action Button - Text on tablet/desktop, compact "+" button on smaller widths */}
        <Link
          href="/products/new"
          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-xs transition-all touch-target cursor-pointer shrink-0"
          title="Add New Product"
        >
          <PlusCircle className="w-5 h-5 hidden sm:inline-block" />
          <Plus className="w-5 h-5 sm:hidden" />
          <span className="hidden sm:inline">+ Add Product</span>
          <span className="sm:hidden font-bold">Add</span>
        </Link>
      </div>

      {/* Search and Filter Toolbar - Tablet First Layout */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or manufacturer..."
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 touch-target"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 touch-target flex items-center justify-center cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl border font-bold text-xs sm:text-sm transition-colors touch-target cursor-pointer shrink-0 ${
              activeFilterCount > 0
                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filter Chips & Item Count Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
            <span className="font-bold text-slate-800">
              Showing {filteredProducts.length} of {products.length} Products
            </span>

            {filters.category !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-[11px]">
                Cat: {categories.find((c) => c.id === filters.category)?.name || filters.category}
              </span>
            )}

            {filters.stockStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-[11px]">
                Stock: {filters.stockStatus}
              </span>
            )}

            {filters.expiryStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-[11px]">
                Expiry: {filters.expiryStatus}
              </span>
            )}
          </div>

          {(searchQuery || activeFilterCount > 0) && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-extrabold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Drawer Component */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        categories={categories}
        filters={filters}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        onResetFilters={resetAllFilters}
      />

      {/* Loading Skeletons */}
      {isProductsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-16 bg-slate-50 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-10 sm:p-14 rounded-2xl border border-slate-200 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">No products found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {products.length === 0
                ? 'Get started by creating the first agricultural product for your shop.'
                : 'No products match your search or filter selection. Try clearing filters.'}
            </p>
          </div>

          {activeFilterCount > 0 ? (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all touch-target cursor-pointer"
            >
              Clear Filters
            </button>
          ) : (
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all touch-target"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Product Now</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* TABLET PORTRAIT (768px – 1023px) & MOBILE (< 768px): Structured Card-Table Hybrid */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredProducts.map((product) => {
              const categoryName =
                product.category?.name ||
                categories.find((c) => c.id === product.category_id)?.name ||
                'General';

              return (
                <ProductCard key={product.id} product={product} categoryName={categoryName} />
              );
            })}
          </div>

          {/* TABLET LANDSCAPE (1024px – 1199px) & DESKTOP (≥ 1200px): Responsive Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-300 shadow-2xs overflow-hidden w-full max-w-full">
            <table className="w-full text-left text-sm border-collapse table-fixed">
              <thead className="bg-slate-100 border-b border-slate-300 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="py-3.5 px-4 border-r border-slate-300 w-1/3">Product & Company</th>
                  <th className="py-3.5 px-3 border-r border-slate-200 text-center w-12">#</th>
                  <th className="py-3.5 px-4 border-r border-slate-200 w-1/6">Pack Variant</th>
                  <th className="py-3.5 px-4 border-r border-slate-200 text-right w-24">Cost</th>
                  <th className="py-3.5 px-4 border-r border-slate-200 text-right w-28">Selling Price</th>
                  <th className="py-3.5 px-4 border-r border-slate-200 text-right w-20">Stock</th>
                  <th className="py-3.5 px-4 border-r border-slate-200 text-center w-28">Expiry</th>
                  <th className="py-3.5 px-4 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const variants = product.variants || [];
                  const categoryName =
                    product.category?.name ||
                    categories.find((c) => c.id === product.category_id)?.name ||
                    'General';

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
                        <td className="py-3.5 px-4 border-r border-slate-300 font-bold text-slate-900">
                          <Link
                            href={`/products/${product.id}`}
                            className="hover:text-emerald-700 block leading-tight text-base font-extrabold truncate"
                          >
                            {product.name}
                          </Link>
                          {product.company && (
                            <span className="text-xs font-semibold text-slate-600 block mt-0.5 truncate">
                              {product.company}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mt-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>{categoryName}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center border-r border-slate-200 font-mono text-xs text-slate-400 font-bold">
                          1
                        </td>

                        <td className="py-3.5 px-4 border-r border-slate-200 font-bold text-slate-900 truncate">
                          {singleVar.variant_name || 'Standard Pack'}
                        </td>

                        <td className="py-3.5 px-4 border-r border-slate-200 text-right font-mono text-xs text-slate-600 tabular-nums">
                          ₹{Number(singleVar.cost_price).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 border-r border-slate-200 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                          ₹{Number(singleVar.selling_price).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 border-r border-slate-200 text-right font-mono font-extrabold tabular-nums">
                          <span
                            className={
                              Number(singleVar.stock_quantity) > 0 ? 'text-emerald-800' : 'text-red-600'
                            }
                          >
                            {singleVar.stock_quantity}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 border-r border-slate-200 text-center">
                          {renderExpiryBadge(singleVar.expiry_date)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/products/${product.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-xs font-bold text-slate-800 transition-colors shadow-2xs touch-target cursor-pointer"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  }

                  const rowSpan = variants.length;
                  const totalStock = variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);

                  return variants.map((variant: ProductVariant, index: number) => {
                    const isFirst = index === 0;

                    return (
                      <tr
                        key={variant.id || `${product.id}-${index}`}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          !isFirst ? 'border-t border-slate-200' : 'border-t-2 border-slate-300'
                        }`}
                      >
                        {isFirst && (
                          <td
                            rowSpan={rowSpan}
                            className="py-4 px-4 border-r border-slate-300 bg-slate-50/50 align-top space-y-2"
                          >
                            <div>
                              <Link
                                href={`/products/${product.id}`}
                                className="font-extrabold text-base text-slate-900 hover:text-emerald-700 block leading-tight truncate"
                              >
                                {product.name}
                              </Link>
                              {product.company && (
                                <p className="text-xs font-bold text-slate-600 mt-0.5 truncate">
                                  {product.company}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-300">
                                <Tag className="w-3 h-3 text-slate-400" />
                                <span>{categoryName}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Layers className="w-3 h-3 text-emerald-600" />
                                <span>{variants.length} Packs</span>
                              </span>
                            </div>

                            <div className="pt-2 text-xs font-mono font-bold text-slate-700">
                              Total Stock: <span className="text-emerald-800">{totalStock} units</span>
                            </div>
                          </td>
                        )}

                        <td className="py-3 px-3 text-center border-r border-slate-200 font-mono text-xs font-bold text-slate-600 bg-slate-50/40">
                          {index + 1}
                        </td>

                        <td className="py-3 px-4 border-r border-slate-200 font-bold text-slate-900 truncate">
                          {variant.variant_name}
                        </td>

                        <td className="py-3 px-4 border-r border-slate-200 text-right font-mono text-xs text-slate-600 tabular-nums">
                          ₹{Number(variant.cost_price).toFixed(2)}
                        </td>

                        <td className="py-3 px-4 border-r border-slate-200 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                          ₹{Number(variant.selling_price).toFixed(2)}
                        </td>

                        <td className="py-3 px-4 border-r border-slate-200 text-right font-mono font-extrabold tabular-nums">
                          <span
                            className={
                              Number(variant.stock_quantity) > 0 ? 'text-emerald-800' : 'text-red-600'
                            }
                          >
                            {variant.stock_quantity}
                          </span>
                        </td>

                        <td className="py-3 px-4 border-r border-slate-200 text-center">
                          {renderExpiryBadge(variant.expiry_date)}
                        </td>

                        {isFirst && (
                          <td
                            rowSpan={rowSpan}
                            className="py-4 px-4 text-center align-top bg-white border-l border-slate-200"
                          >
                            <Link
                              href={`/products/${product.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-xs font-bold text-slate-800 transition-colors shadow-2xs touch-target cursor-pointer"
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
        </>
      )}
    </div>
  );
}
