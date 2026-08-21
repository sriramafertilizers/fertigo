'use client';

import React from 'react';
import { CheckCircle2, X, ShoppingBag, User, Phone, CreditCard, ArrowRight, PackageCheck, Trash2 } from 'lucide-react';
import { SaleWithItems } from '@/lib/types';
import Link from 'next/link';

interface SaleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleWithItems | null;
  onDelete?: (saleId: string) => void;
}

export default function SaleSuccessModal({
  isOpen,
  onClose,
  sale,
  onDelete,
}: SaleSuccessModalProps) {
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-emerald-600 px-6 py-6 text-white text-center space-y-2 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-emerald-100 hover:text-white p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Invoice Details</h3>
          <p className="text-xs text-emerald-100">
            Invoice <span className="font-mono font-bold text-white">{sale.bill_number}</span>
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
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold block">
                Payment Mode
              </span>
              <span className="font-bold text-emerald-800 text-xs font-mono flex items-center gap-1 mt-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{sale.payment_mode}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold block">
                Date & Time
              </span>
              <span className="font-semibold text-slate-700 text-xs font-mono mt-1 block">
                {sale.created_at ? new Date(sale.created_at).toLocaleString('en-IN') : 'Just now'}
              </span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Purchased Items ({sale.items?.length || 0})
            </span>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
              {sale.items?.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-3 bg-white">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.product_name}</span>
                    <span className="text-slate-500 text-[11px]">{item.variant_name}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-slate-600 font-medium block">
                      {item.quantity} × ₹{Number(item.unit_price).toFixed(2)}
                    </span>
                    <strong className="text-slate-900 font-extrabold">
                      ₹{Number(item.total_price).toFixed(2)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(sale.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer touch-target"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete Invoice</span>
              </button>
            ) : (
              <Link
                href="/products"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                Check Inventory Stock
              </Link>
            )}

            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer touch-target"
            >
              <span>Close / Done</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
