'use client';

import React from 'react';
import Link from 'next/link';
import { SaleWithItems, ProductWithVariants } from '@/lib/types';
import { getExpiryStatus } from '@/lib/utils';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertTriangle,
  PackageX,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
} from 'lucide-react';

interface DashboardMetricsProps {
  sales: SaleWithItems[];
  products: ProductWithVariants[];
}

export default function DashboardMetrics({ sales, products }: DashboardMetricsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Calculate Today's Sales & Metrics
  let todaySalesTotal = 0;
  let todayCashTotal = 0;
  let todayUpiTotal = 0;
  let todayCreditTotal = 0;
  let todayBillCount = 0;

  let yesterdaySalesTotal = 0;

  sales.forEach((s) => {
    if (!s.created_at) return;
    const sDate = new Date(s.created_at);

    if (sDate >= today) {
      const net = Number(s.net_amount || 0);
      todaySalesTotal += net;
      todayBillCount += 1;

      if (s.payment_mode === 'CASH') todayCashTotal += net;
      else if (s.payment_mode === 'UPI') todayUpiTotal += net;
      else if (s.payment_mode === 'CREDIT') todayCreditTotal += net;
    } else if (sDate >= yesterday && sDate < today) {
      yesterdaySalesTotal += Number(s.net_amount || 0);
    }
  });

  const liquidCollections = todayCashTotal + todayUpiTotal;

  // % change vs yesterday
  let percentageChange = 0;
  if (yesterdaySalesTotal > 0) {
    percentageChange = Math.round(((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100);
  } else if (todaySalesTotal > 0) {
    percentageChange = 100;
  }

  // Inventory Stock & Expiry Health Metrics
  let lowStockCount = 0;
  let expiringSoonCount = 0;

  products.forEach((p) => {
    (p.variants || []).forEach((v) => {
      if (Number(v.stock_quantity || 0) <= 10) lowStockCount += 1;

      const exp = getExpiryStatus(v.expiry_date);
      if (exp.status === 'EXPIRED' || exp.status === 'CRITICAL' || exp.status === 'WARNING') {
        expiringSoonCount += 1;
      }
    });
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-full">
      {/* Metric 1: Today's Total Sales Revenue */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Today&apos;s Revenue
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <IndianRupee className="w-5 h-5 text-emerald-700" />
          </div>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            ₹{todaySalesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            {percentageChange >= 0 ? (
              <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{percentageChange}% vs yesterday</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{percentageChange}% vs yesterday</span>
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex justify-between">
          <span>{todayBillCount} bills created today</span>
          <Link href="/sales" className="text-emerald-700 font-bold hover:underline">
            View Register →
          </Link>
        </div>
      </div>

      {/* Metric 2: Liquid Cash & UPI Collected */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Cash & UPI Received
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5 text-blue-700" />
          </div>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            ₹{liquidCollections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Cash: <strong className="text-slate-800">₹{todayCashTotal.toFixed(0)}</strong> | UPI: <strong className="text-slate-800">₹{todayUpiTotal.toFixed(0)}</strong>
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
          Instant liquid funds in counter
        </div>
      </div>

      {/* Metric 3: Katha Credit Issued Today */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-amber-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Katha Credit Issued
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5 text-amber-700" />
          </div>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-800 font-mono tabular-nums">
            ₹{todayCreditTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-bold text-amber-700 mt-1">
            {todayCreditTotal > 0 ? '⚠️ Outstanding farmer credit added today' : 'No credit issued today'}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex justify-between">
          <span>Farmer credit ledger</span>
          <Link href="/farmers" className="text-amber-800 font-bold hover:underline">
            Manage Katha →
          </Link>
        </div>
      </div>

      {/* Metric 4: Inventory Low Stock & Expiry Health Widget */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Inventory Health Alerts
          </span>
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <PackageX className="w-3.5 h-3.5 text-amber-600" /> Low Stock Packs:
            </span>
            <strong className={`font-mono font-extrabold ${lowStockCount > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
              {lowStockCount} items
            </strong>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-red-600" /> Expiry Warnings:
            </span>
            <strong className={`font-mono font-extrabold ${expiringSoonCount > 0 ? 'text-red-700' : 'text-slate-700'}`}>
              {expiringSoonCount} items
            </strong>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex justify-between">
          <span>Catalog health check</span>
          <Link href="/products" className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
            <span>Catalog</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
