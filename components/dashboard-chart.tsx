'use client';

import React, { useState, useMemo } from 'react';
import { SaleWithItems } from '@/lib/types';
import { BarChart3, TrendingUp, Calendar, Filter, CreditCard, Sparkles } from 'lucide-react';

interface DashboardChartProps {
  sales: SaleWithItems[];
}

export default function DashboardChart({ sales }: DashboardChartProps) {
  const [timeframe, setTimeframe] = useState<'7DAYS' | '30DAYS' | 'THIS_MONTH'>('7DAYS');
  const [activeHoverIdx, setActiveHoverIdx] = useState<number | null>(null);

  // Group sales by date based on selected timeframe
  const chartData = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let daysCount = 7;
    if (timeframe === '30DAYS') daysCount = 30;
    if (timeframe === 'THIS_MONTH') daysCount = now.getDate();

    const dates: Array<{
      dateStr: string;
      label: string;
      fullDateLabel: string;
      totalRevenue: number;
      cashRevenue: number;
      upiRevenue: number;
      creditRevenue: number;
      billCount: number;
    }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });

      dates.push({
        dateStr: key,
        label: daysCount <= 7 ? dayName : `${d.getDate()} ${monthName}`,
        fullDateLabel: `${d.getDate()} ${monthName} ${year}`,
        totalRevenue: 0,
        cashRevenue: 0,
        upiRevenue: 0,
        creditRevenue: 0,
        billCount: 0,
      });
    }

    // Populate sales data into date buckets
    sales.forEach((s) => {
      if (!s.created_at) return;
      const sDate = new Date(s.created_at);
      const year = sDate.getFullYear();
      const month = String(sDate.getMonth() + 1).padStart(2, '0');
      const day = String(sDate.getDate()).padStart(2, '0');
      const sKey = `${year}-${month}-${day}`;

      const bucket = dates.find((b) => b.dateStr === sKey);
      if (bucket) {
        const net = Number(s.net_amount || 0);
        bucket.totalRevenue += net;
        bucket.billCount += 1;

        if (s.payment_mode === 'CASH') bucket.cashRevenue += net;
        else if (s.payment_mode === 'UPI') bucket.upiRevenue += net;
        else if (s.payment_mode === 'CREDIT') bucket.creditRevenue += net;
      }
    });

    return dates;
  }, [sales, timeframe]);

  const maxRevenue = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.totalRevenue), 1);
    return Math.ceil(max / 1000) * 1000 || 1000;
  }, [chartData]);

  const totalPeriodRevenue = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.totalRevenue, 0);
  }, [chartData]);

  const totalPeriodBills = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.billCount, 0);
  }, [chartData]);

  const activeItem = activeHoverIdx !== null ? chartData[activeHoverIdx] : chartData[chartData.length - 1];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4 w-full max-w-full">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
            <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Daily Sales Analytics</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
            Daily Revenue & Sales Velocity
          </h3>
        </div>

        {/* Timeframe Selector Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
          {(
            [
              { id: '7DAYS', label: 'Last 7 Days' },
              { id: '30DAYS', label: 'Last 30 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTimeframe(item.id);
                setActiveHoverIdx(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all touch-target cursor-pointer ${
                timeframe === item.id
                  ? 'bg-white text-emerald-900 shadow-2xs border border-slate-200/80 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200/80 text-xs">
        <div>
          <span className="text-slate-500 font-medium block">Selected Period Revenue</span>
          <strong className="text-base sm:text-lg font-extrabold text-emerald-800 font-mono tabular-nums">
            ₹{totalPeriodRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium block">Total Bills Issued</span>
          <strong className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
            {totalPeriodBills} bills
          </strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium block">Selected Date ({activeItem?.label || 'Today'})</span>
          <strong className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tabular-nums">
            ₹{activeItem?.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
          </strong>
        </div>
        <div>
          <span className="text-slate-500 font-medium block">Cash vs Credit Split</span>
          <span className="font-extrabold text-slate-800 font-mono text-xs">
            ₹{activeItem?.cashRevenue.toFixed(0) || 0} Cash | ₹{activeItem?.creditRevenue.toFixed(0) || 0} Katha
          </span>
        </div>
      </div>

      {/* SVG Bar / Chart Container */}
      <div className="relative pt-4 pb-2">
        <div className="h-56 sm:h-64 w-full flex items-end justify-between gap-1.5 sm:gap-3 px-1 border-b border-slate-200">
          {chartData.map((d, idx) => {
            const heightPercent = Math.max(8, Math.round((d.totalRevenue / maxRevenue) * 100));
            const isHovered = activeHoverIdx === idx;
            const isToday = idx === chartData.length - 1;

            return (
              <div
                key={d.dateStr}
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
                onClick={() => setActiveHoverIdx(idx)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Value Label above bar */}
                <div
                  className={`text-[10px] font-mono font-bold transition-all mb-1 truncate max-w-full ${
                    isHovered || isToday ? 'text-emerald-800 scale-105' : 'text-slate-400'
                  }`}
                >
                  {d.totalRevenue > 0 ? `₹${(d.totalRevenue / 1000).toFixed(1)}k` : ''}
                </div>

                {/* Stacked Visual Bar */}
                <div className="w-full max-w-[40px] rounded-t-xl bg-slate-100 overflow-hidden flex flex-col justify-end transition-all h-full max-h-[85%] border border-slate-200/60">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full transition-all duration-300 rounded-t-xl flex flex-col justify-end overflow-hidden ${
                      isHovered
                        ? 'bg-emerald-600 shadow-md ring-2 ring-emerald-400'
                        : isToday
                        ? 'bg-emerald-500'
                        : 'bg-emerald-600/80 hover:bg-emerald-600'
                    }`}
                  >
                    {/* Payment Mode Segmentation inside bar */}
                    {d.totalRevenue > 0 && (
                      <>
                        <div
                          style={{
                            height: `${(d.creditRevenue / d.totalRevenue) * 100}%`,
                          }}
                          className="bg-amber-400/90 w-full"
                          title={`Katha Credit: ₹${d.creditRevenue}`}
                        />
                        <div
                          style={{
                            height: `${(d.upiRevenue / d.totalRevenue) * 100}%`,
                          }}
                          className="bg-blue-400/90 w-full"
                          title={`UPI: ₹${d.upiRevenue}`}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Date Axis Label */}
                <span
                  className={`text-[10px] sm:text-xs font-bold mt-2 truncate max-w-full transition-colors ${
                    isHovered || isToday ? 'text-emerald-800 font-extrabold' : 'text-slate-500'
                  }`}
                >
                  {d.label}
                </span>

                {/* Floating Tooltip card when hovered */}
                {isHovered && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 w-48 bg-slate-900 text-white rounded-xl p-3 shadow-2xl text-xs space-y-1 pointer-events-none">
                    <div className="font-extrabold text-emerald-400 border-b border-slate-700 pb-1">
                      {d.fullDateLabel}
                    </div>
                    <div className="flex justify-between font-mono pt-1">
                      <span className="text-slate-300">Total Revenue:</span>
                      <strong className="text-white">₹{d.totalRevenue.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-emerald-300">Cash:</span>
                      <span>₹{d.cashRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-blue-300">UPI:</span>
                      <span>₹{d.upiRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-amber-300">Katha Credit:</span>
                      <span>₹{d.creditRevenue.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      {d.billCount} bills generated
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
            <span>Cash Sales</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-blue-400" />
            <span>UPI Digital</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Katha Credit</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Tap or hover any day bar to view detailed breakdown
        </span>
      </div>
    </div>
  );
}
