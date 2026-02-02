'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Briefcase, FileText, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Onboarding', href: '/onboarding', icon: FileText },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Reachr
          </h1>
          <span className="text-[10px] bg-primary text-white px-2 py-1 rounded uppercase tracking-wide font-semibold shadow-[0_0_15px_rgba(0,200,83,0.3)]">Portal</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,200,83,0.15)]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
