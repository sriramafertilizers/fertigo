'use client';

import React, { useState } from 'react';
import { Tag, X, Plus } from 'lucide-react';
import { DashRing } from '@/components/loading-ui/dash-ring';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (categoryName: string) => Promise<void>;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onAddCategory,
}: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddCategory(categoryName.trim());
      setCategoryName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Bio-Pesticides, Micronutrients..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !categoryName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <DashRing size={16} className="text-white" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
