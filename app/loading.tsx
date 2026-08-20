import React from 'react';
import { DashRing } from '@/components/loading-ui/dash-ring';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4 space-y-4">
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col items-center gap-3">
        <DashRing size={40} className="text-emerald-600" />
        <span className="text-sm font-semibold text-slate-700">Loading Fertigo...</span>
      </div>
    </div>
  );
}
