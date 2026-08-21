'use client';

import React, { useEffect } from 'react';
import { X, Filter, RotateCcw, Check } from 'lucide-react';
import { Category } from '@/lib/types';

export interface FilterOptions {
  category: string;
  stockStatus: 'ALL' | 'HEALTHY' | 'LOW' | 'OUT_OF_STOCK';
  expiryStatus: 'ALL' | 'OK' | 'EXPIRING_SOON' | 'EXPIRED';
  sortBy: 'NAME_ASC' | 'STOCK_DESC' | 'STOCK_ASC' | 'PRICE_ASC' | 'PRICE_DESC';
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  onResetFilters: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  categories,
  filters,
  onApplyFilters,
  onResetFilters,
}: FilterDrawerProps) {
  const [localFilters, setLocalFilters] = React.useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeFilterCount =
    (localFilters.category !== 'ALL' ? 1 : 0) +
    (localFilters.stockStatus !== 'ALL' ? 1 : 0) +
    (localFilters.expiryStatus !== 'ALL' ? 1 : 0) +
    (localFilters.sortBy !== 'NAME_ASC' ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white shadow-2xl z-10 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Filter className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Filter & Sort Products</h3>
              <p className="text-xs text-slate-500 font-medium">Narrow down product inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors touch-target-lg flex items-center justify-center cursor-pointer"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              Product Category
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, category: 'ALL' })}
                className={`w-full text-left px-3.5 py-3 rounded-xl border text-sm font-semibold flex items-center justify-between touch-target ${
                  localFilters.category === 'ALL'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                {localFilters.category === 'ALL' && <Check className="w-4 h-4 text-emerald-700" />}
              </button>
              {categories.map((cat) => {
                const isSelected = localFilters.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setLocalFilters({ ...localFilters, category: cat.id })}
                    className={`w-full text-left px-3.5 py-3 rounded-xl border text-sm font-semibold flex items-center justify-between touch-target ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              Stock Availability
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'ALL', label: 'All Stock' },
                { id: 'HEALTHY', label: 'Healthy (>10)' },
                { id: 'LOW', label: 'Low Stock (1-10)' },
                { id: 'OUT_OF_STOCK', label: 'Out of Stock (0)' },
              ].map((item) => {
                const isSelected = localFilters.stockStatus === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        stockStatus: item.id as FilterOptions['stockStatus'],
                      })
                    }
                    className={`px-3 py-3 rounded-xl border text-xs font-bold text-center touch-target ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expiry Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              Expiry Health
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'ALL', label: 'All Dates' },
                { id: 'OK', label: 'Good / OK' },
                { id: 'EXPIRING_SOON', label: 'Expiring Soon' },
                { id: 'EXPIRED', label: 'Expired' },
              ].map((item) => {
                const isSelected = localFilters.expiryStatus === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setLocalFilters({
                        ...localFilters,
                        expiryStatus: item.id as FilterOptions['expiryStatus'],
                      })
                    }
                    className={`px-3 py-3 rounded-xl border text-xs font-bold text-center touch-target ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort By Option */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              Sort By
            </label>
            <select
              value={localFilters.sortBy}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  sortBy: e.target.value as FilterOptions['sortBy'],
                })
              }
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none touch-target"
            >
              <option value="NAME_ASC">Product Name (A-Z)</option>
              <option value="STOCK_DESC">Highest Stock First</option>
              <option value="STOCK_ASC">Lowest Stock First</option>
              <option value="PRICE_ASC">Selling Price (Low to High)</option>
              <option value="PRICE_DESC">Selling Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onResetFilters();
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-100 touch-target-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset All</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyFilters(localFilters);
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md touch-target-lg cursor-pointer"
          >
            <span>Apply Filters ({activeFilterCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
