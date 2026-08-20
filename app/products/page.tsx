'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getShop, getProducts, getCategories } from '@/lib/supabase/db';
import { ProductWithVariants } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import {
  Package,
  Search,
  Filter,
  PlusCircle,
  ChevronRight,
  Tag,
  Layers,
  XCircle,
  IndianRupee,
} from 'lucide-react';

export default function ProductsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Fetch Active Shop
  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  // Fetch Products & Categories
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

  // Filter Products
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

  const getPriceRange = (variants: ProductWithVariants['variants']) => {
    if (!variants || variants.length === 0) return 'No variants';
    const prices = variants.map((v) => Number(v.selling_price || 0));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `₹${min.toFixed(2)}`;
    return `₹${min.toFixed(2)} – ₹${max.toFixed(2)}`;
  };

  const getTotalStock = (variants: ProductWithVariants['variants']) => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);
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
            Manage agri inputs, pack sizes, costs, selling prices, and inventory
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
        {/* Search Input */}
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

        {/* Category Dropdown */}
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

      {/* Loading State with DashRing */}
      {isProductsLoading ? (
        <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <DashRing size={36} />
          <span className="text-sm font-semibold text-slate-700">Loading catalog products...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
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
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Variants</th>
                  <th className="py-3 px-4 text-right">Selling Price Range</th>
                  <th className="py-3 px-4 text-right">Total Stock</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const totalStock = getTotalStock(product.variants);
                  const categoryName =
                    product.category?.name ||
                    categories.find((c) => c.id === product.category_id)?.name ||
                    'General';

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <Link
                          href={`/products/${product.id}`}
                          className="hover:text-emerald-700 flex items-center gap-2"
                        >
                          <span>{product.name}</span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {product.company || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{categoryName}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                          <Layers className="w-3 h-3 text-emerald-600" />
                          <span>{product.variants?.length || 0}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {getPriceRange(product.variants)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                        <span
                          className={totalStock > 0 ? 'text-emerald-700' : 'text-amber-600'}
                        >
                          {totalStock}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/products/${product.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white text-xs font-semibold text-slate-700 transition-colors"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {filteredProducts.map((product) => {
              const totalStock = getTotalStock(product.variants);
              const categoryName =
                product.category?.name ||
                categories.find((c) => c.id === product.category_id)?.name ||
                'General';

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all space-y-3 block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        {product.name}
                      </h3>
                      {product.company && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {product.company}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {categoryName}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">
                        Variants
                      </span>
                      <span className="font-semibold text-slate-800">
                        {product.variants?.length || 0} pack sizes
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">
                        Price Range
                      </span>
                      <span className="font-bold text-emerald-800">
                        {getPriceRange(product.variants)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-500 font-medium">Total Stock:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {totalStock} units
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
