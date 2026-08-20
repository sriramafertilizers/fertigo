'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, CreditCard, MapPin, Sprout, StickyNote, ChevronRight } from 'lucide-react';
import { Farmer } from '@/lib/types';
import { createFarmer, updateFarmer } from '@/lib/supabase/db';

const CROP_OPTIONS = [
  'Rice', 'Cotton', 'Maize', 'Sugarcane', 'Groundnut',
  'Chilli', 'Vegetables', 'Tobacco', 'Sunflower', 'Jowar', 'Other',
];

interface FarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (farmer: Farmer) => void;
  shopId: string;
  farmer?: Farmer | null;
}

export default function FarmerModal({ isOpen, onClose, onSaved, shopId, farmer }: FarmerModalProps) {
  const isEditing = Boolean(farmer);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [village, setVillage] = useState('');
  const [landAcres, setLandAcres] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(farmer?.name || '');
      setMobile(farmer?.mobile || '');
      setAadharNumber(farmer?.aadhar_number || '');
      setVillage(farmer?.village || '');
      setLandAcres(farmer?.land_acres?.toString() || '');
      setSelectedCrops(farmer?.crop_types || []);
      setNotes(farmer?.notes || '');
      setError(null);
    }
  }, [isOpen, farmer]);

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Farmer name is required'); return; }
    setError(null);
    setIsSaving(true);

    try {
      const payload = {
        name: name.trim(),
        mobile: mobile.trim() || null,
        aadhar_number: aadharNumber.trim() || null,
        village: village.trim() || null,
        land_acres: landAcres ? parseFloat(landAcres) : null,
        crop_types: selectedCrops.length ? selectedCrops : null,
        notes: notes.trim() || null,
      };

      let saved: Farmer;
      if (isEditing && farmer) {
        saved = await updateFarmer({ id: farmer.id, ...payload });
      } else {
        saved = await createFarmer(shopId, payload);
      }
      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save farmer');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? 'Edit Farmer Details' : 'Register New Farmer'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Update farmer profile information' : 'Add a new farmer to your registry'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Section 1: Personal Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Personal Details</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mamidala Ashok"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-900 placeholder:font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Mobile Number</span>
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-slate-400" />
                    <span>Aadhaar Number</span>
                  </label>
                  <input
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    placeholder="12-digit Aadhaar"
                    maxLength={12}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Farm & Location */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>Farm & Location</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>Village</span>
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Kaikaluru"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Land Size (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={landAcres}
                    onChange={(e) => setLandAcres(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Crop Types <span className="text-slate-400 font-normal">(Select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CROP_OPTIONS.map((crop) => {
                    const active = selectedCrops.includes(crop);
                    return (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 3: Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5 text-emerald-600" />
                <span>Notes</span>
              </h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any notes about this farmer (e.g. buys in bulk, prefers Katha)"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="px-6 py-4 border-t border-slate-200 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer transition-all"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>{isEditing ? 'Save Changes' : 'Register Farmer'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
