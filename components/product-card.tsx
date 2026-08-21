'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProductWithVariants, ProductVariant } from '@/lib/types';
import { getExpiryStatus } from '@/lib/utils';
import {
  Tag,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  PackageCheck,
  PackageX,
  Info,
} from 'lucide-react';

interface ProductCardProps {
  product: ProductWithVariants;
  categoryName: string;
}

export default function ProductCard({ product, categoryName }: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);

  const variants = product.variants || [];

  const totalStock = variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);

  const renderExpiryBadge = (expiryDateStr?: string | null) => {
    const expiry = getExpiryStatus(expiryDateStr);

    if (expiry.status === 'NONE') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          <span>OK</span>
        </span>
      );
    }
    if (expiry.status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-md bg-red-100 text-red-900 border border-red-300">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>{expiry.label}</span>
        </span>
      );
    }
    if (expiry.status === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>{expiry.label}</span>
        </span>
      );
    }
    if (expiry.status === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{expiry.label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{expiry.formattedDate}</span>
      </span>
    );
  };

  const renderStockBadge = (stockQty: number) => {
    if (stockQty <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
          <PackageX className="w-3.5 h-3.5 text-red-600" />
          <span>Out of Stock</span>
        </span>
      );
    }
    if (stockQty <= 10) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Low ({stockQty})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
        <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Stock {stockQty}</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300">
      
      {/* Primary Card Top Row: Product Identity + Action */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          {/* Level 1 — Product identity (Product Name + Company) */}
          <div className="min-w-0 flex-1 space-y-1">
            <Link
              href={`/products/${product.id}`}
              className="text-base sm:text-lg font-extrabold text-slate-900 hover:text-emerald-700 transition-colors block leading-snug truncate"
            >
              {product.name}
            </Link>
            {product.company && (
              <p className="text-xs sm:text-sm font-bold text-slate-600 truncate">
                {product.company}
              </p>
            )}
          </div>

          {/* Level 7 — Primary Action (View / Manage ->) */}
          <div className="shrink-0 flex items-center gap-2">
            <Link
              href={`/products/${product.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-xs font-extrabold text-slate-800 transition-all touch-target cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Level 2 — Badges (Category & Variants count) */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>{categoryName}</span>
          </span>

          {variants.length > 1 ? (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>{variants.length} Pack Sizes</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              <span>Single Pack</span>
            </span>
          )}

          <span className="text-xs font-mono font-bold text-slate-600 ml-auto">
            Total Stock: <strong className="text-emerald-800">{totalStock} units</strong>
          </span>
        </div>

        {/* Level 3 - 6 — Pack Variants List */}
        <div className="mt-2 space-y-2">
          {variants.map((v: ProductVariant, idx: number) => (
            <div
              key={v.id || idx}
              className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              {/* Pack Variant Name & Cost */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">
                    {v.variant_name || 'Standard Pack'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Cost: <span className="font-mono">₹{Number(v.cost_price).toFixed(2)}</span>
                  </span>
                </div>
              </div>

              {/* Selling Price, Stock Badge, Expiry Badge */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                {/* Selling price */}
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 font-semibold block sm:hidden">Selling Price</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tabular-nums">
                    ₹{Number(v.selling_price).toFixed(2)}
                  </span>
                </div>

                {/* Stock Badge */}
                <div>{renderStockBadge(Number(v.stock_quantity))}</div>

                {/* Expiry Badge */}
                <div>{renderExpiryBadge(v.expiry_date)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Level 11 — Progressive Disclosure Expand/Collapse Accordion */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors touch-target cursor-pointer"
          >
            <Info className="w-4 h-4 text-emerald-600" />
            <span>{expanded ? 'Hide Full Details' : 'View Full Details & Meta'}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <Link
            href={`/products/${product.id}`}
            className="text-xs font-bold text-slate-600 hover:text-emerald-700 underline"
          >
            Edit Product →
          </Link>
        </div>
      </div>

      {/* Expanded Details Panel */}
      {expanded && (
        <div className="px-4 py-4 bg-slate-100/80 border-t border-slate-200 space-y-3 text-xs">
          <h4 className="font-extrabold uppercase tracking-wider text-slate-700 text-[11px]">
            Product Metadata & Shop Details
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Category</span>
              <strong className="text-slate-900 font-bold">{categoryName}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Manufacturer / Supplier</span>
              <strong className="text-slate-900 font-bold">{product.company || 'Not Specified'}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Total Stock Quantity</span>
              <strong className="text-emerald-800 font-bold font-mono">{totalStock} units</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-3">
              <span className="text-slate-500 block text-[11px] mb-1">Pack Size Pricing Breakdown</span>
              <div className="space-y-1">
                {variants.map((v, i) => (
                  <div key={i} className="flex justify-between items-center text-xs font-mono py-0.5 border-b border-slate-100 last:border-0">
                    <span>{v.variant_name}</span>
                    <span>
                      Cost: ₹{Number(v.cost_price).toFixed(2)} | Sell: <strong className="text-slate-900">₹{Number(v.selling_price).toFixed(2)}</strong> | Stock: <strong className="text-emerald-800">{v.stock_quantity}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
