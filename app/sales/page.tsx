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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Receipt className="w-4 h-4" />
            <span>Sales & Invoice History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Sales Register
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View past farmer bills, item breakdown, payment modes, and sales volume
          </p>
        </div>

        <Link
          href="/billing"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>+ Create New Farmer Bill</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Bills Generated</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {sales.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Sales Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-2 font-mono tabular-nums">
            ₹{totalSalesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Items Sold</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {sales.reduce((acc, s) => acc + (s.items?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by farmer name, mobile number, or bill number..."
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
      </div>

      {/* Sales History Table */}
      {isSalesLoading ? (
        <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <DashRing size={36} />
          <span className="text-sm font-semibold text-slate-700">Loading sales history...</span>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No sales bills found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {sales.length === 0
              ? 'Start by creating your first farmer bill to record sales & deduct inventory stock.'
              : 'No sales match your current search query.'}
          </p>
          {sales.length === 0 && (
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Bill Now</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-300 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700">
              <tr>
                <th className="py-3 px-4">Bill Number & Date</th>
                <th className="py-3 px-4">Farmer / Customer</th>
                <th className="py-3 px-4">Items Purchased</th>
                <th className="py-3 px-4 text-right">Net Amount</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
                <th className="py-3 px-4 text-center">Action</th>
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
                      <div>{sale.bill_number}</div>
                      <div className="text-[11px] font-sans text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{sale.customer_name}</div>
                      {sale.customer_mobile && (
                        <div className="text-xs font-mono text-slate-500 font-normal">
                          {sale.customer_mobile}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="space-y-0.5 max-w-xs">
                        {sale.items?.slice(0, 2).map((item) => (
                          <div key={item.id} className="text-slate-800 truncate">
                            <span className="font-bold">{item.quantity}x</span> {item.product_name} ({item.variant_name})
                          </div>
                        ))}
                        {(sale.items?.length || 0) > 2 && (
                          <span className="text-[11px] text-emerald-700 font-bold">
                            +{(sale.items?.length || 0) - 2} more items
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SaleSuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sale={selectedSale}
      />
    </div>
  );
}
