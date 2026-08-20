'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, X, Plus, Building2, User, Phone, Landmark, FileText, MapPin, Save } from 'lucide-react';
import { DashRing } from '@/components/loading-ui/dash-ring';
import { Company } from '@/lib/types';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompany?: Company | null;
  onAddCompany: (companyData: Omit<Company, 'id' | 'shop_id' | 'created_at'>) => Promise<Company>;
  onEditCompany?: (companyData: Partial<Company> & { id: string }) => Promise<Company>;
}

export default function CompanyModal({
  isOpen,
  onClose,
  initialCompany,
  onAddCompany,
  onEditCompany,
}: CompanyModalProps) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCompany) {
      setName(initialCompany.name || '');
      setContactPerson(initialCompany.contact_person || '');
      setPhone(initialCompany.phone || '');
      setAccountNumber(initialCompany.account_number || '');
      setBankName(initialCompany.bank_name || '');
      setIfscCode(initialCompany.ifsc_code || '');
      setGstin(initialCompany.gstin || '');
      setAddress(initialCompany.address || '');
    } else {
      setName('');
      setContactPerson('');
      setPhone('');
      setAccountNumber('');
      setBankName('');
      setIfscCode('');
      setGstin('');
      setAddress('');
    }
  }, [initialCompany, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (initialCompany && onEditCompany) {
        await onEditCompany({
          id: initialCompany.id,
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          phone: phone.trim() || null,
          account_number: accountNumber.trim() || null,
          bank_name: bankName.trim() || null,
          ifsc_code: ifscCode.trim() || null,
          gstin: gstin.trim() || null,
          address: address.trim() || null,
        });
      } else {
        await onAddCompany({
          name: name.trim(),
          contact_person: contactPerson.trim() || null,
          phone: phone.trim() || null,
          account_number: accountNumber.trim() || null,
          bank_name: bankName.trim() || null,
          ifsc_code: ifscCode.trim() || null,
          gstin: gstin.trim() || null,
          address: address.trim() || null,
        });
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save company');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialCompany ? 'Edit Supplier / Company' : 'Add New Supplier / Company'}
              </h3>
              <p className="text-xs text-slate-500">
                {initialCompany ? 'Update supplier contact & bank payment details' : 'Register company details, contact person & bank account info'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Company / Manufacturer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gentech, IFFCO, Bayer, Syngenta, Coromandel..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Person Name</span>
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Srinivas Rao (Sales Officer)"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile / Phone</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Bank Account Info Section */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Company Bank Account Details (For Payments)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. SBI, HDFC"
                  className="w-full px-2.5 py-1 rounded border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="30123456789"
                  className="w-full px-2.5 py-1 rounded border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="SBIN0001234"
                  className="w-full px-2.5 py-1 rounded border border-slate-300 text-xs font-mono uppercase text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* GSTIN & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>GSTIN</span>
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="37AAAAA0000A1Z5"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono uppercase text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Branch / Address</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Main Road, Guntur Branch"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <DashRing size={16} className="text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  {initialCompany ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{initialCompany ? 'Save Changes' : 'Save Company'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
