'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavbarProps {
  user?: {
    email: string;
  };
}

const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Dashboard', description: 'Overzicht van je SEO automatisering' },
  '/onboarding': { title: 'Profile Setup', description: 'Configureer je website profiel' },
  '/jobs': { title: 'Jobs', description: 'Monitor je content workflows' },
  '/settings': { title: 'Instellingen', description: 'Beheer je account en integraties' },
};

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const pageInfo = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] || { title: 'Dashboard', description: '' };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-8 sticky top-0 z-20">
      {/* Breadcrumb / Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{pageInfo.title}</h2>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Zoeken...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white rounded border border-slate-200">
            <span>⌘</span>K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Help */}
        <Link
          href="#"
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Link>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200" />

        {/* User */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium shadow-lg shadow-emerald-500/20">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-900">
                {user.email.split('@')[0]}
              </p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
