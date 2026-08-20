'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShop, getCompanies, getProducts, createCompany, updateCompany, deleteCompany } from '@/lib/supabase/db';
import { Company, ProductWithVariants } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import CompanyModal from '@/components/company-modal';
import {
  Building2,
  PlusCircle,
  Search,
  Phone,
  Landmark,
  FileText,
  MapPin,
  Package,
  IndianRupee,
  User,
  Trash2,
  Edit2,
  AlertTriangle,
  TrendingUp,
  XCircle,
} from 'lucide-react';

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  const { data: companies = [], isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['companies', shop?.id],
    queryFn: () => (shop?.id ? getCompanies(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: () => (shop?.id ? getProducts(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const handleAddCompany = async (companyData: Omit<Company, 'id' | 'shop_id' | 'created_at'>) => {
    if (!shop?.id) throw new Error('Shop not active');
    const newComp = await createCompany(shop.id, companyData);
    queryClient.invalidateQueries({ queryKey: ['companies', shop.id] });
    return newComp;
  };

  const handleEditCompany = async (companyData: Partial<Company> & { id: string }) => {
    const updated = await updateCompany(companyData);
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    return updated;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteCompany(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setDeletingId(null);
    },
  });

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.bank_name && c.bank_name.toLowerCase().includes(q))
    );
  });

  // Analytics per company
  const getCompanyMetrics = (companyId: string, companyName: string) => {
    const compProducts = products.filter(
      (p) => p.company_id === companyId || p.company?.toLowerCase() === companyName.toLowerCase()
    );

    let costValue = 0;
    let sellingValue = 0;
    let totalStockUnits = 0;

    compProducts.forEach((p) => {
      (p.variants || []).forEach((v) => {
        const stock = Number(v.stock_quantity || 0);
        const cost = Number(v.cost_price || 0);
        const selling = Number(v.selling_price || 0);

        costValue += stock * cost;
        sellingValue += stock * selling;
        totalStockUnits += stock;
      });
    });

    const potentialProfit = sellingValue - costValue;

    return {
      productsCount: compProducts.length,
      compProducts,
      totalStockUnits,
      costValue,
      sellingValue,
      potentialProfit,
    };
  };

  const overallCostValue = products.reduce((acc, p) => {
    return (
      acc +
      (p.variants || []).reduce(
        (vAcc, v) => vAcc + Number(v.stock_quantity || 0) * Number(v.cost_price || 0),
        0
      )
    );
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Building2 className="w-4 h-4" />
            <span>Supplier & Manufacturer Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Companies & Suppliers
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage company profiles, contact representatives, bank account payment info & stock analytics
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCompany(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>+ Add Supplier / Company</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Registered Companies</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {companies.length}
          </div>
        </div>

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
            <span className="text-xs font-semibold text-slate-600">Total Stock Cost Value</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-2 font-mono tabular-nums">
            ₹{overallCostValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Active Distributors</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {companies.length > 0 ? companies.length : 0}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name, contact person, mobile number, or bank..."
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

      {/* Loading State */}
      {isCompaniesLoading ? (
        <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <DashRing size={36} />
          <span className="text-sm font-semibold text-slate-700">Loading companies...</span>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No companies found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {companies.length === 0
              ? 'Start by adding your first supplier / company (e.g. Gentech, IFFCO, Bayer) to manage bank details & products.'
              : 'No companies match your current search query.'}
          </p>
          {companies.length === 0 && (
            <button
              onClick={() => {
                setEditingCompany(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all mt-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Company Now</span>
            </button>
          )}
        </div>
      ) : (
        /* Companies Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((comp) => {
            const metrics = getCompanyMetrics(comp.id, comp.name);

            return (
              <div
                key={comp.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">
                          {comp.name}
                        </h3>
                        {comp.gstin && (
                          <span className="text-[11px] font-mono text-slate-400">
                            GST: {comp.gstin}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCompany(comp);
                          setIsModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-emerald-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
                        title="Edit Company Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingId(comp.id)}
                        className="text-slate-300 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Delete Company"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Representative */}
                  {(comp.contact_person || comp.phone) && (
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      {comp.contact_person && (
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{comp.contact_person}</span>
                        </div>
                      )}
                      {comp.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <a href={`tel:${comp.phone}`} className="hover:underline text-emerald-700 font-bold">
                            {comp.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bank Details for Payments */}
                  {(comp.account_number || comp.bank_name || comp.ifsc_code) ? (
                    <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Bank Account Info (For Payments)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-sans">
                            Bank
                          </span>
                          <span className="font-semibold text-slate-900">
                            {comp.bank_name || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-sans">
                            IFSC
                          </span>
                          <span className="font-semibold text-slate-900 uppercase">
                            {comp.ifsc_code || '—'}
                          </span>
                        </div>
                        <div className="col-span-2 border-t border-emerald-200/50 pt-1">
                          <span className="text-slate-400 block text-[10px] uppercase font-sans">
                            Account Number
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {comp.account_number || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No bank account info added</div>
                  )}

                  {comp.address && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{comp.address}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Metrics */}
                <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Supplied Products</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {metrics.productsCount} items ({metrics.totalStockUnits} stock)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 text-[11px] block">Total Stock Cost</span>
                    <span className="font-bold text-emerald-800 font-mono text-sm">
                      ₹{metrics.costValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Company?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to remove this supplier profile?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending ? (
                  <>
                    <DashRing size={16} className="text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CompanyModal
        isOpen={isModalOpen}
        initialCompany={editingCompany}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCompany(null);
        }}
        onAddCompany={handleAddCompany}
        onEditCompany={handleEditCompany}
      />
    </div>
  );
}
