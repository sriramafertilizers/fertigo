'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, getShop, signOutUser } from '@/lib/supabase/db';
import {
  Sprout,
  Store,
  Package,
  PlusCircle,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Settings,
  Briefcase,
  Receipt,
  History,
  Users,
  LayoutDashboard,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    setDrawerOpen(false);
    await signOutUser();
    queryClient.clear();
    router.push('/');
  };

  // Close drawer on window resize to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escape key listener for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    if (drawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'New Sale (Billing)', href: '/billing', icon: Receipt },
    { name: 'Products Catalog', href: '/products', icon: Package },
    { name: 'Farmers', href: '/farmers', icon: Users },
    { name: 'Companies', href: '/companies', icon: Briefcase },
    { name: 'Sales History', href: '/sales', icon: History },
    { name: 'Shop Settings', href: '/settings', icon: Settings },
  ];

  const activeShop = currentUser ? shop : null;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs h-16 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full gap-2">
            
            {/* Left section: Drawer Toggle (Tablet & Mobile) + Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Drawer Toggle Button - Visible up to 1200px (xl:hidden) */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="xl:hidden p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-emerald-700 active:bg-slate-200 transition-colors touch-target-lg flex items-center justify-center cursor-pointer"
                aria-label="Open Navigation Drawer"
                title="Navigation Menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Fertigo Brand Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors shrink-0">
                  <Sprout className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                      Fertigo
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                      ERP
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline-block font-medium">
                    Agri Retail ERP
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle Section: Active Customer Shop Badge */}
            <div className="flex items-center gap-2">
              {currentUser && activeShop ? (
                <Link
                  href="/products"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-xs font-semibold text-slate-800 transition-colors max-w-[200px] sm:max-w-xs truncate"
                  title="Active Shop"
                >
                  <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{activeShop.name}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 hidden sm:inline" />
                </Link>
              ) : currentUser && !activeShop ? (
                <Link
                  href="/register-shop"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Register Your Shop</span>
                </Link>
              ) : null}
            </div>

            {/* Right section: Desktop Navigation Links (Only on xl >= 1200px) */}
            <nav className="hidden xl:flex items-center gap-1.5">
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
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 shadow-2xs border border-emerald-200/80 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}

              {/* Desktop User Account / Sign In */}
              {currentUser ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <span className="text-xs font-mono font-semibold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="max-w-[120px] truncate">
                      {currentUser.phone || currentUser.email || 'User'}
                    </span>
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer touch-target"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login?mode=signin"
                    className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="text-xs font-bold px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                  >
                    Register Shop
                  </Link>
                </div>
              )}
            </nav>

          </div>
        </div>
      </header>

      {/* Slide-Over Tablet & Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex overflow-hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 transition-transform transform ease-in-out duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-2xs">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">Fertigo ERP</h2>
                  <p className="text-xs text-slate-500 font-medium">Agri Shop Workspace</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors touch-target-lg flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Shop Information Card */}
            {activeShop && (
              <div className="p-3.5 mx-3 mt-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Store className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Active Shop</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{activeShop.name}</p>
                </div>
              </div>
            )}

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
              {currentUser && activeShop ? (
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
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-bold transition-all touch-target-lg ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{link.name}</span>
                    </Link>
                  );
                })
              ) : (
                <div className="py-4 space-y-2">
                  <p className="text-xs text-slate-500 font-medium px-3">
                    Sign in to access your fertilizer & agri-input shop data.
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer / Account Controls */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              {currentUser ? (
                <>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-mono font-semibold text-slate-700 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[150px]">
                        {currentUser.phone || currentUser.email || 'User'}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors touch-target-lg border border-red-200 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login?mode=signin"
                    onClick={() => setDrawerOpen(false)}
                    className="block text-center py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl touch-target"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    onClick={() => setDrawerOpen(false)}
                    className="block text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs touch-target"
                  >
                    Register Shop / Sign Up
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
