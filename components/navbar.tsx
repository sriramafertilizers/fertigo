'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, getShop, signOutUser } from '@/lib/supabase/db';
import { Sprout, Store, Package, PlusCircle, Menu, X, ChevronRight, LogOut, User as UserIcon, Settings, Briefcase, Receipt, History, Users } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch Current User
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  // Fetch Active Shop (only enabled if currentUser exists)
  const { data: shop } = useQuery({
    queryKey: ['shop', currentUser?.id],
    queryFn: () => getShop(),
    enabled: Boolean(currentUser),
  });

  const handleSignOut = async () => {
    await signOutUser();
    queryClient.clear();
    router.push('/');
  };

  const navLinks = [
    { name: 'New Sale (Billing)', href: '/billing', icon: Receipt },
    { name: 'Products Catalog', href: '/products', icon: Package },
    { name: 'Farmers', href: '/farmers', icon: Users },
    { name: 'Companies', href: '/companies', icon: Briefcase },
    { name: 'Sales History', href: '/sales', icon: History },
    { name: 'Shop Settings', href: '/settings', icon: Settings },
  ];

  const activeShop = currentUser ? shop : null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Active Shop */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                    Fertigo
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ERP
                  </span>
                </div>
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                  The simple ERP for agri shops
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden md:block" />

            {/* Active Customer Shop Badge (Only visible when user is signed in) */}
            {currentUser && activeShop ? (
              <Link
                href="/products"
                className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 hover:bg-slate-200 text-xs font-medium text-slate-800 transition-colors"
                title="Active Shop"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-900">{activeShop.name}</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </Link>
            ) : currentUser && !activeShop ? (
              <Link
                href="/register-shop"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Your Shop</span>
              </Link>
            ) : null}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {currentUser &&
              activeShop &&
              navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === '/products'
                    ? pathname.startsWith('/products') && pathname !== '/products/new'
                    : pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs border border-emerald-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}

            {/* User Account / Sign In Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-xs font-mono font-semibold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.phone || currentUser.email || 'User'}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login?mode=signin"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                >
                  Register Shop / Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser && activeShop && (
              <Link
                href="/products"
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
              >
                {activeShop.name}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
          {currentUser &&
            activeShop &&
            navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

          {currentUser ? (
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-600">
                {currentUser.phone || currentUser.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <Link
                href="/login?mode=signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 bg-slate-200 text-slate-800 font-semibold text-sm rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 bg-emerald-600 text-white font-semibold text-sm rounded-lg"
              >
                Register Shop / Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
