'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getShop, getSales } from '@/lib/supabase/db';
import { SaleWithItems } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import SaleSuccessModal from '@/components/sale-success-modal';
import {
  Receipt,
  PlusCircle,
  Search,
  User,
  Phone,
  CreditCard,
  ShoppingBag,
  Calendar,
  IndianRupee,
  Eye,
  XCircle,
  ChevronRight,
} from 'lucide-react';

export default function SalesHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  const { data: sales = [], isLoading: isSalesLoading } = useQuery({
    queryKey: ['sales', shop?.id],
    queryFn: () => (shop?.id ? getSales(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.bill_number.toLowerCase().includes(q) ||
      s.customer_name.toLowerCase().includes(q) ||
      (s.customer_mobile && s.customer_mobile.includes(q))
    );
  });

  const totalSalesAmount = sales.reduce((sum, s) => sum + Number(s.net_amount || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Sales & Invoice History</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 truncate">
            Sales Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block truncate">
            View past farmer bills, item breakdown, payment modes, and sales volume
          </p>
        </div>

        <Link
          href="/billing"
          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-xs transition-all touch-target cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>+ Create New Bill</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Bills</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
            {sales.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Sales Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-2 font-mono tabular-nums truncate">
            ₹{totalSalesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Items Sold</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
            {sales.reduce((acc, s) => acc + (s.items?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by farmer name, mobile, or bill number..."
          className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 shadow-2xs touch-target"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sales History Content */}
      {isSalesLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 font-bold text-slate-700 text-sm">
          <DashRing size={36} />
          <span>Loading sales register...</span>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white p-10 sm:p-14 rounded-2xl border border-slate-200 text-center space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">No sales bills found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {sales.length === 0
              ? 'Start by creating your first farmer bill to record sales & deduct inventory stock.'
              : 'No sales match your current search query.'}
          </p>
          {sales.length === 0 && (
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all mt-2 touch-target"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Bill Now</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Tablet Portrait & Mobile: Card Hybrid */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {filteredSales.map((sale) => {
              const dateObj = new Date(sale.created_at || Date.now());
              const formattedDate = dateObj.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={sale.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-extrabold text-slate-500 block">
                        {sale.bill_number}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 mt-0.5">
                        {sale.customer_name}
                      </h4>
                      {sale.customer_mobile && (
                        <span className="text-xs font-mono text-slate-500 block">
                          {sale.customer_mobile}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tabular-nums block">
                        ₹{Number(sale.net_amount).toFixed(2)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 mt-1">
                        <CreditCard className="w-3 h-3 text-emerald-700" />
                        <span>{sale.payment_mode}</span>
                      </span>
                    </div>
                  </div>

                  {/* Items purchased preview */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Items Purchased</span>
                    {sale.items?.slice(0, 2).map((item) => (
                      <div key={item.id} className="text-slate-800 font-semibold truncate">
                        <strong className="text-emerald-800">{item.quantity}x</strong> {item.product_name} ({item.variant_name})
                      </div>
                    ))}
                    {(sale.items?.length || 0) > 2 && (
                      <span className="text-[11px] text-emerald-700 font-bold block">
                        +{(sale.items?.length || 0) - 2} more items
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formattedDate}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedSale(sale);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-xs font-bold text-slate-800 transition-colors cursor-pointer touch-target"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Invoice</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Landscape Tablet Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-300 shadow-2xs overflow-hidden w-full max-w-full">
            <table className="w-full text-left text-sm border-collapse table-fixed">
              <thead className="bg-slate-100 border-b border-slate-300 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="py-3.5 px-4 w-36">Bill No & Date</th>
                  <th className="py-3.5 px-4 w-1/4">Farmer / Customer</th>
                  <th className="py-3.5 px-4 w-1/3">Items Purchased</th>
                  <th className="py-3.5 px-4 text-right w-32">Net Amount</th>
                  <th className="py-3.5 px-4 text-center w-28">Mode</th>
                  <th className="py-3.5 px-4 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSales.map((sale) => {
                  const dateObj = new Date(sale.created_at || Date.now());
                  const formattedDate = dateObj.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                        <div className="truncate">{sale.bill_number}</div>
                        <div className="text-[11px] font-sans text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="truncate">{sale.customer_name}</div>
                        {sale.customer_mobile && (
                          <div className="text-xs font-mono text-slate-500 font-normal truncate">
                            {sale.customer_mobile}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="space-y-0.5">
                          {sale.items?.slice(0, 2).map((item) => (
                            <div key={item.id} className="text-slate-800 truncate">
                              <span className="font-bold text-emerald-800">{item.quantity}x</span> {item.product_name} ({item.variant_name})
                            </div>
                          ))}
                          {(sale.items?.length || 0) > 2 && (
                            <span className="text-[11px] text-emerald-700 font-bold block">
                              +{(sale.items?.length || 0) - 2} more items
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 text-sm tabular-nums">
                        ₹{Number(sale.net_amount).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                          <CreditCard className="w-3 h-3 text-emerald-700" />
                          <span>{sale.payment_mode}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-xs font-bold text-slate-800 transition-colors cursor-pointer touch-target"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SaleSuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sale={selectedSale}
      />
    </div>
  );
}
