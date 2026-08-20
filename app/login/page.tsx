'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { signUpWithMobile, signInWithMobile, getShop } from '@/lib/supabase/db';
import { DashRing } from '@/components/loading-ui/dash-ring';
import { Sprout, Phone, Lock, ArrowRight, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'signup' || m === 'signin') {
      setMode(m);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanMobile = mobileNumber.trim();
    if (!cleanMobile) {
      setErrorMsg('Please enter your mobile number.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (password.length < 5) {
      setErrorMsg('Password must be at least 5 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'signup') {
        await signUpWithMobile(cleanMobile, password);
        queryClient.invalidateQueries();
        router.push(`/register-shop?phone=${encodeURIComponent(cleanMobile)}`);
      } else {
        await signInWithMobile(cleanMobile, password);
        queryClient.invalidateQueries();
        const existingShop = await getShop();
        if (existingShop) {
          router.push('/products');
        } else {
          router.push(`/register-shop?phone=${encodeURIComponent(cleanMobile)}`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-md">
          <Sprout className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
          <span>Step 1 of 2</span>
          <span>•</span>
          <span>{mode === 'signup' ? 'Account Creation' : 'Shop Sign In'}</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {mode === 'signup' ? 'Create Fertigo Account' : 'Sign In to Your Shop'}
        </h1>
        <p className="text-xs text-slate-500">
          {mode === 'signup'
            ? 'Sign up with your mobile number to create your shop'
            : 'Enter your registered mobile number and password'}
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setErrorMsg(null);
          }}
          className={`py-2.5 rounded-lg transition-all cursor-pointer ${
            mode === 'signin'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setErrorMsg(null);
          }}
          className={`py-2.5 rounded-lg transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>Mobile Number</span>
          </label>
          <input
            type="text"
            required
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Password (min 5 characters)</span>
          </label>
          <input
            type="password"
            required
            minLength={5}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password (e.g. 12345)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer mt-2"
        >
          {isSubmitting ? (
            <>
              <DashRing size={18} className="text-white" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>
                {mode === 'signup'
                  ? 'Create Account & Continue to Shop Setup'
                  : 'Sign In to Shop'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <DashRing size={32} />
            <span className="text-sm font-medium">Loading login...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
