"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BadgeDollarSign, BarChart3, LayoutDashboard, Package, Settings, ShoppingBag, Shield, Store, ScanLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const baseLinks = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/products", label: "Products", icon: Package },
  { href: "/app/orders", label: "Orders", icon: ShoppingBag },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/pos", label: "Offline POS", icon: ScanLine },
  { href: "/app/billing", label: "Billing", icon: BadgeDollarSign },
  { href: "/app/settings", label: "Store Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, userRole } = useAuth();
  const links = userRole === "super_admin"
    ? [{ href: "/admin", label: "Admin Panel", icon: Shield }, ...baseLinks]
    : baseLinks;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pink-600 p-3 text-white"><Store className="h-5 w-5" /></div>
              <div>
                <p className="text-lg font-bold">DukanPer</p>
                <p className="text-sm text-slate-500">Seller App</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${active ? "bg-pink-50 text-pink-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">{user?.displayName || "Seller"}</p>
              <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
              {userRole === "super_admin" ? (
                <Link href="/admin" className="mt-4 block w-full rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800">
                  Open Admin Panel
                </Link>
              ) : null}
              <button onClick={async () => { await logout(); router.push("/login"); }} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white">
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="border-b border-slate-200 bg-white">
          <div className="container-app flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Seller Dashboard</h1>
              <p className="text-sm text-slate-500">Manage your store, products, subscriptions, and orders</p>
            </div>
          </div>
        </header>

        <main className="container-app py-8">{children}</main>
      </div>
    </div>
  );
}
