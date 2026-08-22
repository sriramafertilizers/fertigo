'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getShop,
  getCompanies,
  getCompanyById,
  getProducts,
  updateCompany,
  deleteCompany,
  deleteProduct,
} from '@/lib/supabase/db';
import { Company, ProductWithVariants } from '@/lib/types';
import { DashRing } from '@/components/loading-ui/dash-ring';
import CompanyModal from '@/components/company-modal';
import { getExpiryStatus } from '@/lib/utils';
import {
  Building2,
  ArrowLeft,
  PlusCircle,
  Search,
  Phone,
  Landmark,
  MapPin,
  Package,
  IndianRupee,
  User,
  Trash2,
  Edit2,
  AlertTriangle,
  TrendingUp,
  XCircle,
  Tag,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  Receipt,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const rawId = params.id as string;
  const companyId = decodeURIComponent(rawId);

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'low' | 'outofstock'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Active Shop
  const { data: shop } = useQuery({
    queryKey: ['shop'],
    queryFn: () => getShop(),
  });

  // 2. Fetch Companies List for Shop
  const { data: companies = [], isLoading: isCompaniesLoading } = useQuery({
    queryKey: ['companies', shop?.id],
    queryFn: () => (shop?.id ? getCompanies(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  const isOthersCategory = useMemo(() => {
    const idLower = (companyId || '').toLowerCase();
    return idLower === 'others' || idLower === 'unassigned';
  }, [companyId]);

  // 3. Find target company by ID or Name
  const targetCompany = useMemo(() => {
    if (!companyId) return null;

    if (isOthersCategory) {
      return {
        id: 'others',
        shop_id: shop?.id || '',
        name: 'Others / Unassigned Suppliers',
        contact_person: 'General / Local Vendors',
        address: 'Unassigned supplier products in inventory catalog',
        created_at: new Date().toISOString(),
      } as Company;
    }

    const found = companies.find(
      (c) => c.id === companyId || c.name.toLowerCase() === companyId.toLowerCase()
    );
    if (found) return found;

    // Fallback virtual object if company name is in URL but not in companies table yet
    return {
      id: companyId,
      shop_id: shop?.id || '',
      name: companyId,
      created_at: new Date().toISOString(),
    } as Company;
  }, [companies, companyId, isOthersCategory, shop?.id]);

  // 4. Fetch Products for Shop
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: () => (shop?.id ? getProducts(shop.id) : Promise.resolve([])),
    enabled: Boolean(shop?.id),
  });

  // 5. Filter products belonging to this company
  const companyProducts = useMemo(() => {
    if (!targetCompany) return [];

    if (isOthersCategory) {
      const registeredCompanyNames = new Set(companies.map((c) => c.name.toLowerCase()));
      const registeredCompanyIds = new Set(companies.map((c) => c.id));
      return products.filter((p) => {
        if (p.company_id && registeredCompanyIds.has(p.company_id)) return false;
        if (p.company && registeredCompanyNames.has(p.company.toLowerCase())) return false;
        return true;
      });
    }

    const nameLower = targetCompany.name.toLowerCase();
    return products.filter((p) => {
      if (p.company_id && targetCompany.id && p.company_id === targetCompany.id) return true;
      if (p.company && p.company.toLowerCase() === nameLower) return true;
      return false;
    });
  }, [companies, isOthersCategory, products, targetCompany]);

  // 6. Calculate Company Financial & Stock Analytics
  const analytics = useMemo(() => {
    let totalCostValue = 0;
    let totalSellingValue = 0;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const categoriesSet = new Set<string>();

    companyProducts.forEach((prod) => {
      if (prod.category?.name) {
        categoriesSet.add(prod.category.name);
      }

      (prod.variants || []).forEach((v) => {
        const qty = Number(v.stock_quantity || 0);
        const cost = Number(v.cost_price || 0);
        const selling = Number(v.selling_price || 0);

        totalCostValue += qty * cost;
        totalSellingValue += qty * selling;
        totalStockUnits += qty;

        if (qty === 0) {
          outOfStockCount += 1;
        } else if (qty <= 5) {
          lowStockCount += 1;
        }
      });
    });

    const potentialProfit = totalSellingValue - totalCostValue;
    const marginPct = totalCostValue > 0 ? (potentialProfit / totalCostValue) * 100 : 0;

    return {
      totalCostValue,
      totalSellingValue,
      totalStockUnits,
      potentialProfit,
      marginPct,
      lowStockCount,
      outOfStockCount,
      categories: Array.from(categoriesSet),
    };
  }, [companyProducts]);

  // 7. Filter products based on search & stock dropdown
  const filteredProducts = useMemo(() => {
    return companyProducts.filter((prod) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.category?.name && prod.category.name.toLowerCase().includes(q)) ||
        (prod.variants || []).some((v) => v.variant_name.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || prod.category?.name === selectedCategory;

      if (!matchesSearch || !matchesCategory) return false;

      if (stockFilter === 'all') return true;

      const hasOutOfStock = (prod.variants || []).some((v) => Number(v.stock_quantity || 0) === 0);
      const hasLowStock = (prod.variants || []).some(
        (v) => Number(v.stock_quantity || 0) > 0 && Number(v.stock_quantity || 0) <= 5
      );
      const hasInStock = (prod.variants || []).some((v) => Number(v.stock_quantity || 0) > 5);

      if (stockFilter === 'outofstock') return hasOutOfStock;
      if (stockFilter === 'low') return hasLowStock;
      if (stockFilter === 'instock') return hasInStock;

      return true;
    });
  }, [companyProducts, searchQuery, selectedCategory, stockFilter]);

  // Company Edit Handler
  const handleEditCompany = async (companyData: Partial<Company> & { id: string }) => {
    const updated = await updateCompany(companyData);
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setIsEditModalOpen(false);
    return updated;
  };

  // Company Delete Handler
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteCompany(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      router.push('/companies');
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!mounted || isCompaniesLoading || isProductsLoading) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 max-w-4xl mx-auto font-bold text-slate-700">
        <DashRing size={36} />
        <span>Loading Supplier Details & Product Catalog...</span>
      </div>
    );
  }

  if (!targetCompany) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Companies Directory</span>
        </Link>
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-extrabold text-slate-900">Company Not Found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The supplier profile you are looking for does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full max-w-full overflow-x-hidden">
      {/* 1. Header & Navigation Bar */}
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/companies" className="hover:text-emerald-700 transition-colors flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Companies & Suppliers</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">{targetCompany.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 truncate">
                  {targetCompany.name}
                </h1>
                {targetCompany.gstin && (
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    GST: {targetCompany.gstin}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5">
                Manufacturer Catalog & Supplier Stock Analytics
              </p>
            </div>
          </div>

          {/* Quick Action Launcher Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href={`/products/new?company_id=${targetCompany.id}&company=${encodeURIComponent(targetCompany.name)}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all touch-target cursor-pointer"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              <span>+ Add Product for {targetCompany.name}</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors touch-target cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-emerald-600" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors touch-target cursor-pointer"
              title="Delete Company"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Executive KPI Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Products</span>
            <Package className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {companyProducts.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {analytics.totalStockUnits} total units
            </span>
          </div>
        </div>

        {/* Card 2: Total Inventory Cost Value */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Stock Value (Cost)</span>
            <IndianRupee className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums truncate">
            ₹{analytics.totalCostValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            Cost capital tied in inventory
          </p>
        </div>

        {/* Card 3: Retail Potential & Estimated Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Retail Sales Potential</span>
            <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums truncate">
            ₹{analytics.totalSellingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <span>Profit: +₹{analytics.potentialProfit.toFixed(0)}</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px]">
              {analytics.marginPct.toFixed(1)}% margin
            </span>
          </div>
        </div>

        {/* Card 4: Inventory Health Alerts */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Reorder & Stock Health</span>
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1 text-amber-800 font-bold text-sm bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/70">
              <span>{analytics.lowStockCount}</span>
              <span className="text-xs font-medium">Low</span>
            </div>
            <div className="flex items-center gap-1 text-red-800 font-bold text-sm bg-red-50 px-2.5 py-1 rounded-xl border border-red-200/70">
              <span>{analytics.outOfStockCount}</span>
              <span className="text-xs font-medium">Out</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Supplier Contact & Banking Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Left: Representative Contact Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">Supplier & Representative Contact</h3>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Edit →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Person</span>
              <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                {targetCompany.contact_person || 'Not Specified'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
              {targetCompany.phone ? (
                <a
                  href={`tel:${targetCompany.phone}`}
                  className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold text-sm mt-0.5 hover:underline font-mono"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{targetCompany.phone}</span>
                </a>
              ) : (
                <span className="text-slate-400 italic block mt-0.5">No phone added</span>
              )}
            </div>

            {targetCompany.address && (
              <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Office / Warehouse Address</span>
                <p className="text-slate-700 font-medium mt-0.5 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{targetCompany.address}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Bank Account Details for Payments */}
        <div className="bg-emerald-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Landmark className="w-4.5 h-4.5 text-emerald-400" />
              <h3 className="font-extrabold text-white text-sm">Payment & Bank Transfer Details</h3>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-300 border border-emerald-700">
              NEFT / RTGS / UPI
            </span>
          </div>

          {targetCompany.bank_name || targetCompany.account_number || targetCompany.ifsc_code ? (
            <div className="grid grid-cols-2 gap-3 text-xs pt-1 font-mono">
              <div>
                <span className="text-emerald-400 block text-[10px] font-sans uppercase font-bold">Bank Name</span>
                <span className="font-extrabold text-white text-sm block truncate mt-0.5">
                  {targetCompany.bank_name || '—'}
                </span>
              </div>

              <div>
                <span className="text-emerald-400 block text-[10px] font-sans uppercase font-bold">IFSC Code</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-extrabold text-white text-sm uppercase truncate">
                    {targetCompany.ifsc_code || '—'}
                  </span>
                  {targetCompany.ifsc_code && (
                    <button
                      onClick={() => copyToClipboard(targetCompany.ifsc_code!, 'ifsc')}
                      className="p-1 rounded bg-emerald-800/60 hover:bg-emerald-700 text-emerald-300 transition-colors cursor-pointer"
                      title="Copy IFSC Code"
                    >
                      {copiedField === 'ifsc' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="col-span-2 pt-2 border-t border-emerald-800/80">
                <span className="text-emerald-400 block text-[10px] font-sans uppercase font-bold">Account Number</span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-base tracking-wider">
                    {targetCompany.account_number || '—'}
                  </span>
                  {targetCompany.account_number && (
                    <button
                      onClick={() => copyToClipboard(targetCompany.account_number!, 'account')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      {copiedField === 'account' ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy A/C No</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-emerald-300 italic space-y-1">
              <p>No bank account details recorded for {targetCompany.name}.</p>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-white underline font-bold"
              >
                Add Bank Info Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Full Company Product Catalog & Inventory Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4 sm:p-6">
        
        {/* Catalog Section Header & Search / Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Products Manufactured by {targetCompany.name}
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {filteredProducts.length} items
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Pack sizes, cost prices, selling prices, and current counter stock
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or variants..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown Filter */}
            {analytics.categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {analytics.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Stock Level Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stock Status</option>
              <option value="instock">In Stock (&gt;5)</option>
              <option value="low">Low Stock (1-5)</option>
              <option value="outofstock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Product Catalog Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {companyProducts.length === 0
                ? `No products have been added under ${targetCompany.name} yet.`
                : 'No products match your search or stock filter criteria.'}
            </p>
            <Link
              href={`/products/new?company_id=${targetCompany.id}&company=${encodeURIComponent(targetCompany.name)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all mt-2 touch-target cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add First Product for {targetCompany.name}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((prod) => {
              const variants = prod.variants || [];
              const totalProdStock = variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);

              return (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:border-emerald-300 transition-all space-y-0"
                >
                  {/* Product Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base text-slate-900 truncate">
                            {prod.name}
                          </h3>
                          {prod.category?.name && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold">
                              <Tag className="w-3 h-3 text-emerald-600" />
                              <span>{prod.category.name}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {variants.length} Pack Sizes Available • {totalProdStock} Total Units
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/products/${prod.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit Product</span>
                      </Link>

                      <Link
                        href="/billing"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Sell Bill</span>
                      </Link>
                    </div>
                  </div>

                  {/* Variants & Pack Sizes Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Variant / Pack Size</th>
                          <th className="py-2.5 px-4 text-center">Stock Quantity</th>
                          <th className="py-2.5 px-4 text-right">Cost Price (₹)</th>
                          <th className="py-2.5 px-4 text-right">Selling Price (₹)</th>
                          <th className="py-2.5 px-4 text-right">Margin / Unit</th>
                          <th className="py-2.5 px-4 text-center">Expiry Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {variants.map((v) => {
                          const stock = Number(v.stock_quantity || 0);
                          const cost = Number(v.cost_price || 0);
                          const selling = Number(v.selling_price || 0);
                          const margin = selling - cost;
                          const marginPercent = cost > 0 ? ((margin / cost) * 100).toFixed(1) : '0';
                          const expiryStatus = v.expiry_date ? getExpiryStatus(v.expiry_date) : null;

                          return (
                            <tr key={v.id || v.variant_name} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{v.variant_name}</span>
                                  {v.unit && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {v.pack_quantity ? `${v.pack_quantity} ` : ''}{v.unit}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center font-mono">
                                {stock === 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-extrabold border border-red-200 text-[11px]">
                                    Out of Stock
                                  </span>
                                ) : stock <= 5 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-extrabold border border-amber-200 text-[11px]">
                                    {stock} (Low Stock)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200 text-[11px]">
                                    {stock} in stock
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                                ₹{cost.toFixed(2)}
                              </td>

                              <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                                ₹{selling.toFixed(2)}
                              </td>

                              <td className="py-3 px-4 text-right font-mono">
                                <span className="font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                                  +₹{margin.toFixed(2)} ({marginPercent}%)
                                </span>
                              </td>

                              <td className="py-3 px-4 text-center font-mono text-[11px]">
                                {expiryStatus ? (
                                  <span
                                    className={`px-2 py-0.5 rounded border font-bold ${
                                      expiryStatus.status === 'EXPIRED'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : expiryStatus.status === 'CRITICAL'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {expiryStatus.label}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-sans italic">No Expiry</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Delete {targetCompany.name}?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to remove this manufacturer profile? Associated products will remain in your catalog.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 touch-target"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteCompanyMutation.isPending}
                onClick={() => deleteCompanyMutation.mutate(targetCompany.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-xs transition-all disabled:opacity-50 cursor-pointer touch-target"
              >
                {deleteCompanyMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      <CompanyModal
        isOpen={isEditModalOpen}
        initialCompany={targetCompany}
        onClose={() => setIsEditModalOpen(false)}
        onAddCompany={async () => targetCompany}
        onEditCompany={handleEditCompany}
      />
    </div>
  );
}
