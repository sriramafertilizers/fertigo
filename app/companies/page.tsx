'use client';

import React, { useState, useMemo } from 'react';
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
  Layers,
  ArrowRight,
  ChevronRight,
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

  // Filtered registered companies based on search
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.bank_name && c.bank_name.toLowerCase().includes(q))
      );
    });
  }, [companies, searchQuery]);

  // Registered Companies Sets
  const registeredCompanyNames = useMemo(
    () => new Set(companies.map((c) => c.name.toLowerCase())),
    [companies]
  );
  const registeredCompanyIds = useMemo(
    () => new Set(companies.map((c) => c.id)),
    [companies]
  );

  // Unassigned Products (Products not belonging to any registered company)
  const unassignedProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.company_id && registeredCompanyIds.has(p.company_id)) return false;
      if (p.company && registeredCompanyNames.has(p.company.toLowerCase())) return false;
      return true;
    });
  }, [products, registeredCompanyIds, registeredCompanyNames]);

  // Metrics for Unassigned Products
  const unassignedMetrics = useMemo(() => {
    let costValue = 0;
    let sellingValue = 0;
    let totalStockUnits = 0;

    unassignedProducts.forEach((p) => {
      (p.variants || []).forEach((v) => {
        const qty = Number(v.stock_quantity || 0);
        const cost = Number(v.cost_price || 0);
        const selling = Number(v.selling_price || 0);

        costValue += qty * cost;
        sellingValue += qty * selling;
        totalStockUnits += qty;
      });
    });

    const potentialProfit = sellingValue - costValue;
    const marginPct = costValue > 0 ? (potentialProfit / costValue) * 100 : 0;

    return {
      productsCount: unassignedProducts.length,
      totalStockUnits,
      costValue,
      sellingValue,
      potentialProfit,
      marginPct,
    };
  }, [unassignedProducts]);

  // Registered Company metrics calculator
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
    const marginPct = costValue > 0 ? (potentialProfit / costValue) * 100 : 0;

    return {
      productsCount: compProducts.length,
      compProducts,
      totalStockUnits,
      costValue,
      sellingValue,
      potentialProfit,
      marginPct,
    };
  };

  // Overall Store Inventory Metrics (100% of all products)
  const overallMetrics = useMemo(() => {
    let costVal = 0;
    let sellingVal = 0;
    let totalStockUnits = 0;

    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        const qty = Number(v.stock_quantity || 0);
        const cost = Number(v.cost_price || 0);
        const selling = Number(v.selling_price || 0);

        costVal += qty * cost;
        sellingVal += qty * selling;
        totalStockUnits += qty;
      });
    });

    const profit = sellingVal - costVal;
    const marginPct = costVal > 0 ? (profit / costVal) * 100 : 0;

    return {
      costVal,
      sellingVal,
      profit,
      marginPct,
      totalStockUnits,
    };
  }, [products]);

  // Check if "others" or "unassigned" matches search query
  const shouldShowOthersCard = useMemo(() => {
    if (unassignedProducts.length === 0) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return 'others'.includes(q) || 'unassigned'.includes(q) || 'general'.includes(q);
  }, [searchQuery, unassignedProducts.length]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 sm:pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Building2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Supplier & Manufacturer Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 truncate">
            Companies & Suppliers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block truncate">
            Manage company profiles, representative contacts, bank details & manufacturer stock analytics
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCompany(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-md transition-all touch-target cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>+ Add Supplier</span>
        </button>
      </div>

      {/* Summary KPI Cards with Emerald Brand Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Companies Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Suppliers</span>
            <Building2 className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {companies.length}
            </div>
            {unassignedProducts.length > 0 && (
              <span className="text-[11px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                +1 Unassigned Category
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Total Store Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Catalog Products</span>
            <Package className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {products.length}
            </div>
            <span className="text-xs text-slate-500 font-medium block mt-0.5 truncate">
              {overallMetrics.totalStockUnits} physical units in stock
            </span>
          </div>
        </div>

        {/* KPI 3: Total Inventory Stock Value (Cost Price) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Stock Value (Cost)</span>
            <IndianRupee className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-800 font-mono tabular-nums truncate">
              ₹{overallMetrics.costVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5 truncate">
              Purchasing capital tied in stock
            </span>
          </div>
        </div>

        {/* KPI 4: Retail Sales Value & Potential Gross Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Retail Sales Potential</span>
            <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums truncate">
              ₹{overallMetrics.sellingVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold mt-0.5 truncate text-emerald-700">
              <span>Gross Profit: +₹{overallMetrics.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded border border-emerald-200">
                {overallMetrics.marginPct.toFixed(1)}%
              </span>
            </div>
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
          placeholder="Search by supplier name, representative, phone, or bank details..."
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

      {/* Loading State */}
      {isCompaniesLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 font-bold text-slate-700 text-sm">
          <DashRing size={36} />
          <span>Loading suppliers...</span>
        </div>
      ) : filteredCompanies.length === 0 && !shouldShowOthersCard ? (
        <div className="bg-white p-10 sm:p-14 rounded-2xl border border-slate-200 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">No suppliers found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {companies.length === 0
              ? 'Start by adding your first supplier / company (e.g. Coromandel, IFFCO, Bayer) to track bank details & product inventories.'
              : 'No suppliers match your search query.'}
          </p>
          {companies.length === 0 && (
            <button
              onClick={() => {
                setEditingCompany(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all mt-2 cursor-pointer touch-target"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Supplier Now</span>
            </button>
          )}
        </div>
      ) : (
        /* Companies Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Registered Company Cards */}
          {filteredCompanies.map((comp) => {
            const metrics = getCompanyMetrics(comp.id, comp.name);

            return (
              <div
                key={comp.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <Link
                      href={`/companies/${comp.id}`}
                      className="flex items-center gap-3 min-w-0 group/link"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 group-hover/link:bg-emerald-600 group-hover/link:text-white transition-colors">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base text-slate-900 leading-tight truncate group-hover/link:text-emerald-700 transition-colors">
                          {comp.name}
                        </h3>
                        {comp.gstin && (
                          <span className="text-[11px] font-mono text-slate-400 block truncate mt-0.5">
                            GST: {comp.gstin}
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingCompany(comp);
                          setIsModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors touch-target cursor-pointer"
                        title="Edit Company Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingId(comp.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors touch-target cursor-pointer"
                        title="Delete Company"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Representative Contact */}
                  {(comp.contact_person || comp.phone) && (
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs">
                      {comp.contact_person && (
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{comp.contact_person}</span>
                        </div>
                      )}
                      {comp.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <a href={`tel:${comp.phone}`} className="hover:underline font-bold text-emerald-700 truncate">
                            {comp.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bank Details */}
                  {(comp.account_number || comp.bank_name || comp.ifsc_code) ? (
                    <div className="space-y-1 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/80 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <Landmark className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Bank Info</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px] font-mono text-slate-700">
                        <div className="truncate">
                          <span className="text-slate-400 block text-[9px] uppercase font-sans">Bank</span>
                          <span className="font-bold text-slate-900 truncate">{comp.bank_name || '—'}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-400 block text-[9px] uppercase font-sans">IFSC</span>
                          <span className="font-bold text-slate-900 uppercase truncate">{comp.ifsc_code || '—'}</span>
                        </div>
                        <div className="col-span-2 border-t border-emerald-200/50 pt-0.5 truncate">
                          <span className="text-slate-400 block text-[9px] uppercase font-sans">Account No</span>
                          <span className="font-bold text-slate-900 text-xs truncate">{comp.account_number || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {comp.address && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{comp.address}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer with Emerald Brand Accent CTA */}
                <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-5 py-3 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block font-medium">Stock Cost Value</span>
                      <span className="font-extrabold text-slate-900 font-mono text-xs sm:text-sm">
                        ₹{metrics.costValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 block font-medium">Retail Sales Value</span>
                      <span className="font-extrabold text-slate-900 font-mono text-xs sm:text-sm">
                        ₹{metrics.sellingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] font-medium text-slate-600">
                      {metrics.productsCount} items ({metrics.totalStockUnits} stock)
                    </span>
                    <span className="text-[11px] font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      +₹{metrics.potentialProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({metrics.marginPct.toFixed(1)}%)
                    </span>
                  </div>

                  <Link
                    href={`/companies/${comp.id}`}
                    className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-between transition-all shadow-xs touch-target cursor-pointer mt-1"
                  >
                    <span>View {comp.name} Catalog & Stock</span>
                    <ArrowRight className="w-4 h-4 text-emerald-100" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Virtual "Others / Unassigned Suppliers" Card in Emerald Theme */}
          {shouldShowOthersCard && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden group">
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <Link
                    href="/companies/others"
                    className="flex items-center gap-3 min-w-0 group/link"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 group-hover/link:bg-emerald-600 group-hover/link:text-white transition-colors">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-base text-slate-900 leading-tight truncate group-hover/link:text-emerald-700 transition-colors">
                          Others / Unassigned
                        </h3>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Category
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate font-medium mt-0.5">
                        Unassigned products in store catalog
                      </span>
                    </div>
                  </Link>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  Products listed in inventory that do not have a specific supplier assigned. View catalog to categorize them.
                </p>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-5 py-3 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block font-medium">Stock Cost Value</span>
                    <span className="font-extrabold text-slate-900 font-mono text-xs sm:text-sm">
                      ₹{unassignedMetrics.costValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block font-medium">Retail Sales Value</span>
                    <span className="font-extrabold text-slate-900 font-mono text-xs sm:text-sm">
                      ₹{unassignedMetrics.sellingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] font-medium text-slate-600">
                    {unassignedMetrics.productsCount} items ({unassignedMetrics.totalStockUnits} stock)
                  </span>
                  <span className="text-[11px] font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    +₹{unassignedMetrics.potentialProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({unassignedMetrics.marginPct.toFixed(1)}%)
                  </span>
                </div>

                <Link
                  href="/companies/others"
                  className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-between transition-all shadow-xs touch-target cursor-pointer mt-1"
                >
                  <span>View Unassigned Catalog & Stock</span>
                  <ArrowRight className="w-4 h-4 text-emerald-100" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Delete Company?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to remove this supplier profile?
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 touch-target"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingId)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-xs transition-all disabled:opacity-50 cursor-pointer touch-target"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
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
