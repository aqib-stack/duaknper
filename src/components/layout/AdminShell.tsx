"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CreditCard, LayoutDashboard, Settings2, Store, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/stores', label: 'Stores', icon: Store },
  { href: '/admin/payment-proofs', label: 'Payment Proofs', icon: CreditCard },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-white"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-lg font-bold">DukanPer</p>
                <p className="text-sm text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className="h-5 w-5" />{link.label}</Link>;
            })}
          </nav>
          <div className="border-t border-slate-200 p-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">{user?.displayName || 'Admin'}</p>
              <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
              <button onClick={async()=>{await logout(); router.push('/login')}} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white">Logout</button>
            </div>
          </div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="border-b border-slate-200 bg-white">
          <div className="container-app py-4">
            <h1 className="text-xl font-bold text-slate-900">Super Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Manage stores, subscriptions, and payment proofs</p>
          </div>
        </header>
        <main className="container-app py-8">{children}</main>
      </div>
    </div>
  );
}
