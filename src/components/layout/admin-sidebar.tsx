'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Image,
  MessageSquare,
  Clock,
  DollarSign,
  Receipt,
  Users,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/admin/flash-gallery', label: 'Flash Gallery', icon: Image },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/availability', label: 'Availability', icon: Clock },
  { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/admin/deposits', label: 'Deposits', icon: Receipt },
  { href: '/admin/customers', label: 'Customers', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-4">
        <Link href="/admin" className="text-lg font-bold tracking-tight">
          DANIEL PAP
        </Link>
        <p className="text-xs text-zinc-400">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-100 font-medium text-black'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-black'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-black"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
