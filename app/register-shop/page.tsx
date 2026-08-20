'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createShop, getCurrentUser } from '@/lib/supabase/db';
import { Shop } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import { Store, MapPin, Phone, Mail, FileText, Save, Sprout, CheckCircle2, ArrowRight } from 'lucide-react';

function RegisterShopForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const phoneParam = searchParams.get('phone') || '';

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const [formData, setFormData] = useState<Partial<Shop>>({
    name: '',
    gst_number: '',
    phone: phoneParam || '',
    email: '',
    address: '',
    village: '',
    district: '',
    state: '',
    pincode: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.phone && !formData.phone) {
      setFormData((prev) => ({ ...prev, phone: currentUser.phone }));
    }
  }, [currentUser]);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Shop>) => {
      if (!data.name?.trim()) throw new Error('Shop business name is required.');
      return createShop({
        name: data.name.trim(),
        gst_number: data.gst_number?.trim() || null,
        phone: data.phone?.trim() || currentUser?.phone || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        village: data.village?.trim() || null,
        district: data.district?.trim() || null,
        state: data.state?.trim() || null,
        pincode: data.pincode?.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      router.push('/products');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to register shop.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 max-w-3xl mx-auto">
        <DashRing size={36} />
        <span className="text-sm font-semibold text-slate-700">Loading user profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
            Step 2 of 2
          </span>
          <span className="text-emerald-300 font-semibold text-xs uppercase tracking-wider">
            Shop Onboarding
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Register Your Agri Shop</h1>
        <p className="text-sm text-slate-300">
          Enter your shop details (e.g. SriRama Fertilizers) to initialize your catalog & default categories
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shop Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Shop Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. SriRama Fertilizers, Lakshmi Agri Centre..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Shop Mobile / Phone</span>
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900"
              />
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>GSTIN Number <span className="text-slate-400 font-normal">(Optional)</span></span>
              </label>
              <input
                type="text"
                value={formData.gst_number || ''}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                placeholder="37AAAAA0000A1Z5"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono uppercase text-slate-900"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Premises / Street Address</span>
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Main Road, Near Agriculture Market Yard"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            {/* Village */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Village / Town
              </label>
              <input
                type="text"
                value={formData.village || ''}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                placeholder="Guntur Rural"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                District
              </label>
              <input
                type="text"
                value={formData.district || ''}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Guntur"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Andhra Pradesh"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode || ''}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="522001"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending || !formData.name?.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <DashRing size={18} className="text-white" />
                  <span>Registering Shop...</span>
                </>
              ) : (
                <>
                  <span>Register Shop & Open Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-2 text-slate-500 py-16">
          <DashRing size={36} />
          <span className="text-sm font-semibold">Loading registration...</span>
        </div>
      }
    >
      <RegisterShopForm />
    </Suspense>
  );
}
