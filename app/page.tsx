'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getShop } from '@/lib/supabase/db';
import {
  Sprout,
  Store,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  Phone,
  Lock,
  Smartphone,
  ShieldCheck,
  Zap,
  Tag,
} from 'lucide-react';

export default function LandingPage() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  return (
    <div className="space-y-12 sm:space-y-16 max-w-6xl mx-auto py-4 sm:py-8">
      {/* Logged in Active Shop Banner */}
      {currentUser && shop && (
        <div className="bg-emerald-800 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Logged in Active Shop
              </div>
              <h2 className="text-xl font-bold">{shop.name}</h2>
            </div>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-sm hover:bg-emerald-50 transition-all shadow-xs cursor-pointer"
          >
            <span>Enter Shop Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="text-center space-y-6 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Sprout className="w-4 h-4 text-emerald-600" />
          <span>Fertigo — Agricultural Retail ERP</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
          The Simple ERP for <span className="text-emerald-700">Agri Shops</span>.
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Designed specifically for fertilizer, pesticide, and seed retail shop owners.
          Fast, mobile-friendly, and built for daily counter use.
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {currentUser ? (
            shop ? (
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md transition-all cursor-pointer"
              >
                <span>Go to {shop.name} Catalog</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/register-shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md transition-all cursor-pointer"
              >
                <Store className="w-5 h-5" />
                <span>Register Your Shop Now</span>
              </Link>
            )
          ) : (
            <>
              <Link
                href="/login?mode=signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md transition-all cursor-pointer"
              >
                <Store className="w-5 h-5" />
                <span>Register Shop / Sign Up</span>
              </Link>

              <Link
                href="/login?mode=signin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-base transition-colors"
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
          <h3 className="text-lg font-bold text-slate-900">Pack Sizes & Variants</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Logical grouping for liquid bottles (250 ml, 500 ml, 1 L), granular bags (45 kg, 50 kg), and physical pieces under one product name.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Cost & Selling Prices</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Record cost price (₹) and selling price (₹) per variant pack size with instant profit margin calculation per unit.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Mobile & Counter Ready</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Ultra-fast, touch-friendly UI using Rethink Sans font, built to work smoothly on smartphones, iPads, tablets, and shop desktops.
          </p>
        </div>
      </section>

      {/* Practical Shop Flow Overview */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 text-center">
          Built for Daily Agri Shop Operations
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center mx-auto">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Sign Up & Register Shop</h4>
            <p className="text-xs text-slate-500">
              Sign up with mobile & password, then enter your shop name (e.g. SriRama Fertilizers), GSTIN, and location.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center mx-auto">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Add Products & Pack Sizes</h4>
            <p className="text-xs text-slate-500">
              Enter products with company name, category, pack sizes, costs, selling prices, and stock units.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center mx-auto">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Manage & Edit Catalog</h4>
            <p className="text-xs text-slate-500">
              Search by name/company, filter by category, and update prices or add variants anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
