'use client';

import React from 'react';
import { CheckCircle2, X, ShoppingBag, User, Phone, CreditCard, ArrowRight, PackageCheck } from 'lucide-react';
import { SaleWithItems } from '@/lib/types';
import Link from 'next/link';

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleWithItems | null;
}

export default function SaleSuccessModal({
  isOpen,
  onClose,
  sale,
}: SaleSuccessModalProps) {
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-emerald-600 px-6 py-6 text-white text-center space-y-2 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-emerald-100 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Bill Generated Successfully!</h3>
          <p className="text-xs text-emerald-100">
            Invoice <span className="font-mono font-bold text-white">{sale.bill_number}</span> created & inventory stock updated
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Farmer & Payment Info */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold block">
                Farmer Name
              </span>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{sale.customer_name}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold block">
                Mobile Number
              </span>
              <span className="font-semibold text-slate-800 text-xs font-mono flex items-center gap-1 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{sale.customer_mobile || '—'}</span>
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Payment Mode</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                <CreditCard className="w-3 h-3 text-emerald-700" />
                <span>{sale.payment_mode}</span>
              </span>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Purchased Items & Subtotal</span>
            </span>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2 px-3">Item / Pack Size</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{item.product_name}</span>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {item.variant_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                        ₹{Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ₹{Number(item.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Deduction Notification */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Inventory stock has been automatically deducted for all {sale.items.length} items.
            </span>
          </div>

          {/* Grand Total Summary */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 text-right text-xs">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span className="font-mono">₹{Number(sale.total_amount).toFixed(2)}</span>
            </div>
            {Number(sale.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount</span>
                <span className="font-mono">-₹{Number(sale.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-bold text-base pt-1 border-t border-slate-200">
              <span>Net Amount Paid</span>
              <span className="font-mono text-emerald-800">₹{Number(sale.net_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3">
            <Link
              href="/products"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Check Updated Inventory Stock
            </Link>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Done / New Sale</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
