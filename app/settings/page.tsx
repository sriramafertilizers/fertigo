'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShop, updateShop, getProducts, getCategories } from '@/lib/supabase/db';
import { Shop } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import { Store, MapPin, Phone, Mail, FileText, Save, CheckCircle2, Package, Layers, Tag } from 'lucide-react';

export default function ShopSettingsPage() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: shop, isLoading } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: () => (shop?.id ? getProducts(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', shop?.id],
    queryFn: () => (shop?.id ? getCategories(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const [formData, setFormData] = useState<Partial<Shop>>({});

  useEffect(() => {
    if (shop) setFormData(shop);
  }, [shop]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Shop>) => {
      if (!shop) throw new Error('No shop active');
      return updateShop({ id: shop.id, ...data });
    },
    onSuccess: (updatedShop) => {
      queryClient.invalidateQueries({ queryKey: ['shop'] });
      setSuccessMessage('Shop details updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const totalVariantsCount = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
  const totalStockUnits = products.reduce(
    (acc, p) => acc + p.variants.reduce((vAcc, v) => vAcc + Number(v.stock_quantity || 0), 0),
    0
  );

  if (isLoading) {
    return (
      <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 max-w-4xl mx-auto">
        <DashRing size={36} />
        <span className="text-sm font-semibold text-slate-700">Loading shop settings...</span>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-4 max-w-4xl mx-auto">
        <Store className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Shop Registered Yet</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please register your shop to manage business details and product catalog.
        </p>
        <Link
          href="/register-shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
        >
          <span>Register Shop Now</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <Store className="w-4 h-4" />
          <span>Shop Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
          {shop.name} Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View & update your shop GSTIN, phone, address, and location details
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Products</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {products.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Pack Variants</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {totalVariantsCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Categories</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {categories.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Stock</span>
            <Store className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono tabular-nums">
            {totalStockUnits}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Shop Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>GSTIN Number</span>
              </label>
              <input
                type="text"
                value={formData.gst_number || ''}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Shop Phone</span>
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Business Email</span>
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Street Address</span>
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Village / Town
              </label>
              <input
                type="text"
                value={formData.village || ''}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                District
              </label>
              <input
                type="text"
                value={formData.district || ''}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode || ''}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <DashRing size={18} className="text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
