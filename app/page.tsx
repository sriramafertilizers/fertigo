'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getShop, getProducts, getSales, getFarmers, getCategories } from '@/lib/supabase/db';
import DashboardChart from '@/components/dashboard-chart';
import DashboardMetrics from '@/components/dashboard-metrics';
import SaleSuccessModal from '@/components/sale-success-modal';
import { SaleWithItems } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import {
  Sprout,
  Store,
  Package,
  Layers,
  ArrowRight,
  Phone,
  Smartphone,
  Tag,
  Receipt,
  Users,
  Briefcase,
  Settings,
  PlusCircle,
  CreditCard,
  Eye,
  TrendingUp,
  Award,
  Sparkles,
  Percent,
} from 'lucide-react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: shop, isLoading: isShopLoading } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
    enabled: Boolean(currentUser),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: () => (shop?.id ? getProducts(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: sales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['sales', shop?.id],
    queryFn: () => (shop?.id ? getSales(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: farmers = [] } = useQuery({
    queryKey: ['farmers', shop?.id],
    queryFn: () => (shop?.id ? getFarmers(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', shop?.id],
    queryFn: () => (shop?.id ? getCategories(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  // Variant Cost Map
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

  // Calculate Top Selling Products with Revenue & Profit Margins
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; variantName: string; count: number; revenue: number; profit: number }> = {};

    sales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const key = item.product_name;
        const costPrice =
          (item.variant_id ? variantCostMap.get(item.variant_id) : undefined) ??
          variantCostMap.get(`${item.product_name.toLowerCase()}-${item.variant_name.toLowerCase()}`) ??
          Number(item.unit_price) * 0.85;

        const itemProfit = (Number(item.unit_price) - Number(costPrice)) * Number(item.quantity || 1);

        if (!productMap[key]) {
          productMap[key] = {
            name: item.product_name,
            variantName: item.variant_name,
            count: 0,
            revenue: 0,
            profit: 0,
          };
        }
        productMap[key].count += item.quantity;
        productMap[key].revenue += item.total_price;
        productMap[key].profit += itemProfit;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [sales, variantCostMap]);

  if (!mounted || isUserLoading || (currentUser && isShopLoading)) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 max-w-4xl mx-auto font-bold text-slate-700">
        <DashRing size={36} />
        <span>Loading Executive Workspace...</span>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCENARIO A: LOGGED IN USER WITH ACTIVE SHOP -> EXECUTIVE ANALYTICS DASHBOARD
  // --------------------------------------------------------------------------
  if (currentUser && shop) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden">
        
        {/* Executive Banner & Quick Action Launcher */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border border-emerald-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                  Active Counter Shop
                </span>
                <span className="text-xs text-slate-300 font-mono hidden sm:inline">
                  GST: {shop.gst_number || 'Registered'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {shop.name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200 font-medium">
                Executive Revenue, Profit & Counter Analytics Terminal
              </p>
            </div>
          </div>

          {/* Quick POS Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Link
              href="/billing"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all touch-target-lg cursor-pointer"
            >
              <Receipt className="w-4.5 h-4.5" />
              <span>+ New Sale (Billing)</span>
            </Link>

            <Link
              href="/products/new"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-all touch-target border border-white/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* 1. Scorecard Metrics Grid with Gross Profit Scorecard */}
        <DashboardMetrics sales={sales} products={products} />

        {/* 2. Main Analytics Suite: Daily Sales Trend Chart + Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Daily Sales & Revenue Trend Chart (2 columns) */}
          <div className="lg:col-span-2">
            <DashboardChart sales={sales} />
          </div>

          {/* Right: Top Moving Products & Category Split (1 column) */}
          <div className="space-y-6">
            
            {/* Top Selling Products with Revenue & Estimated Margin */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Top Moving Products & Margins</h3>
                </div>
                <Link href="/products" className="text-xs font-bold text-emerald-700 hover:underline">
                  Catalog →
                </Link>
              </div>

              {topProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No products sold yet. Create your first bill to see sales rankings.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topProducts.map((tp, idx) => {
                    const marginPercent = tp.revenue > 0 ? ((tp.profit / tp.revenue) * 100).toFixed(1) : '0';
                    return (
                      <div
                        key={tp.name}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-extrabold font-mono text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 block truncate">{tp.name}</span>
                            <span className="text-[11px] text-slate-500 block truncate">{tp.variantName} • {tp.count} sold</span>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0">
                          <strong className="text-slate-900 font-extrabold block">
                            ₹{tp.revenue.toFixed(0)}
                          </strong>
                          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                            +₹{tp.profit.toFixed(0)} ({marginPercent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick ERP Launchpad Modules */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                ERP Quick Modules
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  href="/products"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 font-extrabold text-slate-800 hover:text-emerald-900 flex items-center gap-2 transition-all touch-target"
                >
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Products ({products.length})</span>
                </Link>

                <Link
                  href="/farmers"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 font-extrabold text-slate-800 hover:text-emerald-900 flex items-center gap-2 transition-all touch-target"
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Farmers ({farmers.length})</span>
                </Link>

                <Link
                  href="/sales"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 font-extrabold text-slate-800 hover:text-emerald-900 flex items-center gap-2 transition-all touch-target"
                >
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Sales ({sales.length})</span>
                </Link>

                <Link
                  href="/settings"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 font-extrabold text-slate-800 hover:text-emerald-900 flex items-center gap-2 transition-all touch-target"
                >
                  <Settings className="w-4 h-4 text-emerald-600" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* 3. Live Recent Sales Register Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Recent Counter Sales Invoices</h3>
              <p className="text-xs text-slate-500 font-medium">Latest bills processed at shop counter</p>
            </div>
            <Link
              href="/sales"
              className="text-xs font-extrabold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View All Sales Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sales.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p>No sales recorded yet. Click &ldquo;+ New Sale (Billing)&rdquo; above to create your first bill.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sales.slice(0, 6).map((sale) => (
                <div
                  key={sale.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-slate-400 block">
                        {sale.bill_number}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">{sale.customer_name}</h4>
                    </div>
                    <span className="font-mono font-extrabold text-emerald-800 text-sm tabular-nums">
                      ₹{Number(sale.net_amount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                      <CreditCard className="w-3 h-3 text-emerald-600" />
                      <span>{sale.payment_mode}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSale(sale);
                        setIsModalOpen(true);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-extrabold hover:underline cursor-pointer"
                    >
                      View Bill →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <SaleSuccessModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sale={selectedSale}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCENARIO B: PUBLIC LANDING PAGE FOR NEW VISITORS
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-12 sm:space-y-16 max-w-6xl mx-auto py-4 sm:py-8 w-full max-w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
          <Sprout className="w-4 h-4 text-emerald-600" />
          <span>Fertigo — Agricultural Retail ERP</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
          The Simple ERP & POS for <span className="text-emerald-700">Agri Shops</span>.
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Designed specifically for fertilizer, pesticide, and seed retail shop owners in India.
          Fast, tablet-first, and built for daily counter use.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {currentUser && !shop ? (
            <Link
              href="/register-shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-md transition-all cursor-pointer touch-target-lg"
            >
              <Store className="w-5 h-5" />
              <span>Register Your Shop Now</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login?mode=signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-md transition-all cursor-pointer touch-target-lg"
              >
                <Store className="w-5 h-5" />
                <span>Register Shop / Sign Up</span>
              </Link>

              <Link
                href="/login?mode=signin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-base transition-colors touch-target-lg"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Sign In with Phone</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Core Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Pack Sizes & Variants</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Logical grouping for liquid bottles (250 ml, 500 ml, 1 L), granular bags (45 kg, 50 kg), and physical pieces under one product name.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Cost & Selling Prices</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Record cost price (₹) and selling price (₹) per variant pack size with instant profit margin calculation per unit.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Tablet & Counter Ready</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Ultra-fast, touch-friendly UI built to work smoothly on Android tablets, iPads, smartphones, and shop desktops.
          </p>
        </div>
      </section>
    </div>
  );
}
