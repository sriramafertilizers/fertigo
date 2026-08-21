'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getShop, getFarmers, deleteFarmer } from '@/lib/supabase/db';
import { Farmer } from '@/lib/types';
import FarmerModal from '@/components/farmer-modal';
import {
  Users,
  PlusCircle,
  Search,
  XCircle,
  IndianRupee,
  MapPin,
  Phone,
  Sprout,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export default function FarmersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [confirmDeleteFarmer, setConfirmDeleteFarmer] = useState<Farmer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ['farmers', shop?.id],
    queryFn: () => (shop?.id ? getFarmers(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const filtered = farmers.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.mobile && f.mobile.includes(q)) ||
      (f.village && f.village.toLowerCase().includes(q))
    );
  });

  const totalKatha = farmers.reduce((sum, f) => sum + Number(f.katha_balance || 0), 0);

  const handleDelete = async (farmer: Farmer) => {
    setConfirmDeleteFarmer(farmer);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteFarmer) return;
    setIsDeleting(true);
    try {
      await deleteFarmer(confirmDeleteFarmer.id);
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      setConfirmDeleteFarmer(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFarmer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Farmer) => {
    setEditingFarmer(f);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Users className="w-4 h-4 shrink-0" />
            <span>Farmer Registry</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 truncate">
            Farmer Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block truncate">
            Register and manage all farmers — track their purchases, land details, and Katha balance
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-xs transition-all touch-target cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>+ Register Farmer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Registered Farmers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">{farmers.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Katha Pending</span>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2 font-mono tabular-nums">
            ₹{totalKatha.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Pending Accounts</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {farmers.filter((f) => Number(f.katha_balance || 0) > 0).length}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by farmer name, mobile, or village..."
          className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 shadow-2xs touch-target"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Farmer List / Grid */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-sm text-slate-500 font-bold">
          Loading farmers database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-10 sm:p-14 rounded-2xl border border-slate-200 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
            {farmers.length === 0 ? 'No farmers registered yet' : 'No farmers match your search'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {farmers.length === 0
              ? 'Register your first farmer to start tracking their purchases and Katha balance.'
              : 'Try a different name, mobile number, or village.'}
          </p>
          {farmers.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-all mt-2 cursor-pointer touch-target"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register First Farmer</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tablet Portrait & Mobile: Card-Table Hybrid Layout */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {filtered.map((farmer) => {
              const katha = Number(farmer.katha_balance || 0);
              return (
                <div
                  key={farmer.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/farmers/${farmer.id}`}
                        className="font-extrabold text-base sm:text-lg text-slate-900 hover:text-emerald-700 transition-colors block"
                      >
                        {farmer.name}
                      </Link>
                      {farmer.village && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-bold mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {farmer.village}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Katha Balance</span>
                      {katha > 0 ? (
                        <span className="text-base font-extrabold text-amber-700 font-mono">
                          ₹{katha.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Cleared ✓
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                    {farmer.mobile && (
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {farmer.mobile}
                      </span>
                    )}

                    {farmer.land_acres && (
                      <span className="font-bold text-slate-600">
                        {farmer.land_acres} Acres
                      </span>
                    )}

                    {farmer.crop_types?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {farmer.crop_types.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold"
                          >
                            <Sprout className="w-3 h-3 text-emerald-600" />
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/farmers/${farmer.id}`}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:text-emerald-900 touch-target"
                    >
                      <span>View Full Profile</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(farmer)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer touch-target"
                        title="Edit Farmer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(farmer)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer touch-target"
                        title="Delete Farmer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Landscape Tablet Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden w-full max-w-full">
            <table className="w-full text-left text-sm border-collapse table-fixed">
              <thead className="bg-slate-100 border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="py-3.5 px-4 w-1/4">Farmer Name</th>
                  <th className="py-3.5 px-4 w-32">Mobile</th>
                  <th className="py-3.5 px-4 w-1/5">Village</th>
                  <th className="py-3.5 px-4 w-1/4">Land / Crops</th>
                  <th className="py-3.5 px-4 text-right w-36">Katha Balance</th>
                  <th className="py-3.5 px-4 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((farmer) => {
                  const katha = Number(farmer.katha_balance || 0);
                  return (
                    <tr key={farmer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/farmers/${farmer.id}`}
                          className="font-extrabold text-slate-900 hover:text-emerald-700 block truncate"
                        >
                          {farmer.name}
                        </Link>
                        {farmer.aadhar_number && (
                          <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                            Aadhaar: ****{farmer.aadhar_number.slice(-4)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-700">
                        {farmer.mobile ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{farmer.mobile}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {farmer.village ? (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{farmer.village}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {farmer.land_acres && (
                          <div className="text-slate-700 font-bold">
                            {farmer.land_acres} acres
                          </div>
                        )}
                        {farmer.crop_types?.length ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {farmer.crop_types.slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold"
                              >
                                <Sprout className="w-2.5 h-2.5" />
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          !farmer.land_acres && <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold tabular-nums">
                        {katha > 0 ? (
                          <span className="text-amber-700">₹{katha.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-700 text-xs font-bold">Cleared ✓</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/farmers/${farmer.id}`}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors touch-target"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(farmer)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-700 transition-colors cursor-pointer touch-target"
                            title="Edit Farmer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(farmer)}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer touch-target"
                            title="Delete Farmer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <FarmerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['farmers'] });
          setIsModalOpen(false);
        }}
        shopId={shop?.id || ''}
        farmer={editingFarmer}
      />

      {/* Delete Confirmation Modal */}
      {confirmDeleteFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Delete Farmer?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <span className="font-bold text-slate-900">{confirmDeleteFarmer.name}</span>?
                  Past bill records will be preserved.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmDeleteFarmer(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer touch-target"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold disabled:opacity-50 cursor-pointer touch-target"
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
