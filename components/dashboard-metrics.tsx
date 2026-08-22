'use client';

import React, { useState, useMemo } from 'react';
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
  Percent,
  Sparkles,
  Calendar,
  Filter,
} from 'lucide-react';

interface DashboardMetricsProps {
  sales: SaleWithItems[];
  products: ProductWithVariants[];
}

type TimeframeOption = 'today' | 'week' | 'month' | 'all';

export default function DashboardMetrics({ sales, products }: DashboardMetricsProps) {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('today');

  // Variant Cost Price Lookup Map for exact profit calculation
  const variantCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (v.id) map.set(v.id, Number(v.cost_price || 0));
        if (v.variant_name) map.set(`${p.name.toLowerCase()}-${v.variant_name.toLowerCase()}`, Number(v.cost_price || 0));
      });
    });
    return map;
  }, [products]);

  // Compute date boundaries
  const dateRanges = useMemo(() => {
    const now = new Date();
    
    // Today 00:00:00
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Yesterday 00:00:00
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Start of Week (Sunday/Monday)
    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOfWeek);

    // Previous Week Start
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    // Start of Month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Previous Month Start
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
      todayStart,
      yesterdayStart,
      weekStart,
      prevWeekStart,
      monthStart,
      prevMonthStart,
    };
  }, []);

  // Filter Sales & Calculate Financial Metrics based on Selected Timeframe
  const metrics = useMemo(() => {
    let salesTotal = 0;
    let grossProfit = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let creditTotal = 0;
    let billCount = 0;

    let prevPeriodSalesTotal = 0;

    sales.forEach((s) => {
      if (!s.created_at) return;
      const sDate = new Date(s.created_at);
      const net = Number(s.net_amount || 0);

      let isCurrentPeriod = false;
      let isPrevPeriod = false;

      if (timeframe === 'today') {
        isCurrentPeriod = sDate >= dateRanges.todayStart;
        isPrevPeriod = sDate >= dateRanges.yesterdayStart && sDate < dateRanges.todayStart;
      } else if (timeframe === 'week') {
        isCurrentPeriod = sDate >= dateRanges.weekStart;
        isPrevPeriod = sDate >= dateRanges.prevWeekStart && sDate < dateRanges.weekStart;
      } else if (timeframe === 'month') {
        isCurrentPeriod = sDate >= dateRanges.monthStart;
        isPrevPeriod = sDate >= dateRanges.prevMonthStart && sDate < dateRanges.monthStart;
      } else if (timeframe === 'all') {
        isCurrentPeriod = true;
      }

      if (isCurrentPeriod) {
        salesTotal += net;
        billCount += 1;

        if (s.payment_mode === 'CASH') cashTotal += net;
        else if (s.payment_mode === 'UPI') upiTotal += net;
        else if (s.payment_mode === 'CREDIT') creditTotal += net;

        // Calculate Gross Profit for items in this bill
        (s.items || []).forEach((item) => {
          const costPrice =
            (item.variant_id ? variantCostMap.get(item.variant_id) : undefined) ??
            variantCostMap.get(`${item.product_name.toLowerCase()}-${item.variant_name.toLowerCase()}`) ??
            Number(item.unit_price) * 0.85;

          const itemProfit = (Number(item.unit_price) - Number(costPrice)) * Number(item.quantity || 1);
          grossProfit += itemProfit;
        });
      } else if (isPrevPeriod) {
        prevPeriodSalesTotal += net;
      }
    });

    const liquidCollections = cashTotal + upiTotal;
    const avgMarginPercent = salesTotal > 0 ? ((grossProfit / salesTotal) * 100).toFixed(1) : '0.0';

    // % change calculation vs prior timeframe
    let percentageChange = 0;
    if (prevPeriodSalesTotal > 0) {
      percentageChange = Math.round(((salesTotal - prevPeriodSalesTotal) / prevPeriodSalesTotal) * 100);
    } else if (salesTotal > 0) {
      percentageChange = 100;
    }

    return {
      salesTotal,
      grossProfit,
      cashTotal,
      upiTotal,
      creditTotal,
      billCount,
      liquidCollections,
      avgMarginPercent,
      percentageChange,
    };
  }, [sales, timeframe, dateRanges, variantCostMap]);

  // Inventory Stock & Expiry Health Metrics
  const { lowStockCount, expiringSoonCount } = useMemo(() => {
    let lowCount = 0;
    let expCount = 0;

    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (Number(v.stock_quantity || 0) <= 10) lowCount += 1;

        const exp = getExpiryStatus(v.expiry_date);
        if (exp.status === 'EXPIRED' || exp.status === 'CRITICAL' || exp.status === 'WARNING') {
          expCount += 1;
        }
      });
    });

    return { lowStockCount: lowCount, expiringSoonCount: expCount };
  }, [products]);

  const timeframeLabels: Record<TimeframeOption, string> = {
    today: "Today's Collections",
    week: 'This Week',
    month: 'This Month',
    all: 'All Time',
  };

  const periodSubtext: Record<TimeframeOption, string> = {
    today: 'vs yesterday',
    week: 'vs last week',
    month: 'vs last month',
    all: 'total store sales',
  };

  return (
    <div className="w-full max-w-full space-y-3 sm:space-y-4">
      {/* Timeframe Selection Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
              Collections & Revenue Window
            </h3>
            <span className="text-[11px] text-slate-500 font-medium block">
              Viewing <strong className="text-emerald-800 font-extrabold">{timeframeLabels[timeframe]}</strong> summary
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTimeframe(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all touch-target cursor-pointer ${
                timeframe === item.id
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Executive Metric Scorecards (5 Cards Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Sales Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {timeframeLabels[timeframe]}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5 text-emerald-700" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              ₹{metrics.salesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {timeframe !== 'all' && (
                metrics.percentageChange >= 0 ? (
                  <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+{metrics.percentageChange}% {periodSubtext[timeframe]}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{metrics.percentageChange}% {periodSubtext[timeframe]}</span>
                  </span>
                )
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex justify-between">
            <span>{metrics.billCount} bills processed</span>
            <Link href="/sales" className="text-emerald-700 font-bold hover:underline">
              Register →
            </Link>
          </div>
        </div>

        {/* Metric 2: Estimated Net Gross Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Est. Gross Profit</span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Percent className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-mono tabular-nums">
              ₹{metrics.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 text-xs font-extrabold text-emerald-700 flex items-center gap-1">
              <span>Avg Margin:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono border border-emerald-300">
                {metrics.avgMarginPercent}%
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Net earning after item cost
          </div>
        </div>

        {/* Metric 3: Liquid Cash & UPI Received */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
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
              ₹{metrics.liquidCollections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1 truncate">
              Cash: <strong className="text-slate-800">₹{metrics.cashTotal.toFixed(0)}</strong> | UPI: <strong className="text-slate-800">₹{metrics.upiTotal.toFixed(0)}</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Liquid cash collected
          </div>
        </div>

        {/* Metric 4: Katha Credit Issued */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-amber-300 transition-all">
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
              ₹{metrics.creditTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs font-bold text-amber-700 mt-1 truncate">
              {metrics.creditTotal > 0 ? '⚠️ Credit issued in period' : 'No credit in period'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex justify-between">
            <span>Farmer credit ledger</span>
            <Link href="/farmers" className="text-amber-800 font-bold hover:underline">
              Katha →
            </Link>
          </div>
        </div>

        {/* Metric 5: Inventory Health Alerts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Inventory Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
          </div>

          <div className="space-y-1">
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
    </div>
  );
}
