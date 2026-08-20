'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShop, getFarmerById, recordKathaPayment, deleteFarmer } from '@/lib/supabase/db';
import { FarmerWithHistory, KathaPayment } from '@/lib/types';
import FarmerModal from '@/components/farmer-modal';
import {
  ArrowLeft,
  User,
  Phone,
  CreditCard,
  MapPin,
  Sprout,
  StickyNote,
  Receipt,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Plus,
  X,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export default function FarmerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const farmerId = params?.id as string;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isKathaModalOpen, setIsKathaModalOpen] = useState(false);
  const [kathaAmount, setKathaAmount] = useState('');
  const [kathaNotes, setKathaNotes] = useState('');
  const [kathaError, setKathaError] = useState('');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: shop } = useQuery({ queryKey: ['shop'], queryFn: () => getShop() });

  const { data: farmer, isLoading } = useQuery({
    queryKey: ['farmer', farmerId],
    queryFn: () => getFarmerById(farmerId),
    enabled: Boolean(farmerId),
  });

  const kathaMutation = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(kathaAmount);
      if (!amt || amt <= 0) throw new Error('Enter a valid amount');
      if (!shop?.id) throw new Error('Shop not found');
      return recordKathaPayment(shop.id, farmerId, amt, kathaNotes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer', farmerId] });
      setIsKathaModalOpen(false);
      setKathaAmount('');
      setKathaNotes('');
      setKathaError('');
    },
    onError: (err: any) => setKathaError(err.message),
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteFarmer(farmerId);
      router.push('/farmers');
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-sm text-slate-500">
        Loading farmer profile...
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-3">
        <p className="font-bold text-slate-900">Farmer not found.</p>
        <Link href="/farmers" className="text-sm text-emerald-700 underline">← Back to Farmer Registry</Link>
      </div>
    );
  }

  const katha = Number(farmer.katha_balance || 0);
  const totalBills = farmer.sales?.length || 0;
  const totalPurchased = (farmer.sales || []).reduce((s, b) => s + Number(b.net_amount || 0), 0);
  const totalPaid = (farmer.katha_payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link href="/farmers" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Farmer Registry</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <Link
            href={`/billing?farmer=${farmerId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>New Bill for Farmer</span>
          </Link>
          <button
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 border border-red-200 cursor-pointer transition-all"
            title="Delete Farmer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Farmer Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold shrink-0">
            {farmer.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{farmer.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
              {farmer.mobile && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono font-semibold">{farmer.mobile}</span>
                </span>
              )}
              {farmer.aadhar_number && (
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{farmer.aadhar_number}</span>
                </span>
              )}
              {farmer.village && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{farmer.village}</span>
                </span>
              )}
              {farmer.land_acres && (
                <span className="flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-slate-400" />
                  <span>{farmer.land_acres} acres</span>
                </span>
              )}
            </div>
            {farmer.crop_types?.length ? (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {farmer.crop_types.map((c) => (
                  <span key={c} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold">
                    <Sprout className="w-2.5 h-2.5" />
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
            {farmer.notes && (
              <p className="mt-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{farmer.notes}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">Total Bills</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">{totalBills}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">Total Purchased</span>
          <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1 block">₹{totalPurchased.toFixed(0)}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">Total Paid</span>
          <span className="text-2xl font-bold text-emerald-800 font-mono tabular-nums mt-1 block">₹{totalPaid.toFixed(0)}</span>
        </div>
        <div className={`p-4 rounded-xl border shadow-2xs ${katha > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1 mb-1">
            Katha Balance
          </span>
          <span className={`text-2xl font-bold font-mono tabular-nums block ${katha > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {katha > 0 ? `₹${katha.toFixed(2)}` : 'Cleared ✓'}
          </span>
          {katha > 0 && (
            <button
              onClick={() => setIsKathaModalOpen(true)}
              className="mt-2 text-[11px] font-bold text-amber-800 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Purchase History ({totalBills} bills)</span>
          </h2>
          <Link href="/billing" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" />
            New Bill
          </Link>
        </div>

        {totalBills === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-1">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No bills yet for this farmer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {farmer.sales?.map((sale) => {
              const isKatha = sale.payment_mode === 'CREDIT';
              return (
                <div key={sale.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-xs">{sale.bill_number}</span>
                      <span className="text-[11px] text-slate-500 font-normal ml-2 flex-inline items-center gap-1">
                        <Calendar className="w-3 h-3 inline-block mr-0.5" />
                        {new Date(sale.created_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isKatha ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                        {isKatha ? '⚠️ Katha' : '✅ ' + sale.payment_mode}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm">₹{Number(sale.net_amount).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    {sale.items?.map((item) => (
                      <div key={item.id}>
                        <span className="font-bold">{item.quantity}×</span> {item.product_name} ({item.variant_name})
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Katha Payment History */}
      {(farmer.katha_payments?.length || 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Katha Payment History ({farmer.katha_payments?.length} payments)</span>
          </h2>
          <div className="space-y-2">
            {farmer.katha_payments?.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-emerald-100 bg-emerald-50">
                <div>
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Payment Received
                  </span>
                  {p.notes && <span className="text-[11px] text-slate-500 block mt-0.5">{p.notes}</span>}
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {new Date(p.created_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-800">+₹{Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <FarmerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['farmer', farmerId] });
          queryClient.invalidateQueries({ queryKey: ['farmers'] });
          setIsEditModalOpen(false);
        }}
        shopId={shop?.id || ''}
        farmer={farmer}
      />

      {/* Katha Payment Modal */}
      {isKathaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Record Katha Payment</h3>
              <button onClick={() => setIsKathaModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Current Katha: <span className="font-bold text-amber-700">₹{katha.toFixed(2)}</span>
            </p>
            {kathaError && (
              <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                {kathaError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  step="any"
                  value={kathaAmount}
                  onChange={(e) => setKathaAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-900 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={kathaNotes}
                  onChange={(e) => setKathaNotes(e.target.value)}
                  placeholder="e.g. Paid by cash, Aug 20"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsKathaModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => kathaMutation.mutate()}
                disabled={kathaMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
              >
                {kathaMutation.isPending ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && farmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Farmer Profile?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-bold text-slate-900">{farmer.name}</span>?
                  Their past bills and purchase history will not be deleted.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50 cursor-pointer transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
