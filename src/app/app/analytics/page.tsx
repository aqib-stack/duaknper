"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, Users, AlertTriangle, Package2, ShoppingCart, Receipt, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getOrdersByStoreId } from "@/lib/services/orders";
import { getProductsByStoreId } from "@/lib/services/products";
import { getStoreByOwnerId } from "@/lib/services/stores";
import { Loader } from "@/components/ui/Loader";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";
import type { Store } from "@/types/store";

function currency(value: number) { return `Rs ${value.toLocaleString()}`; }

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const foundStore = await getStoreByOwnerId(user.uid);
      setStore(foundStore);
      if (foundStore) {
        const [storeOrders, storeProducts] = await Promise.all([getOrdersByStoreId(foundStore.id), getProductsByStoreId(foundStore.id)]);
        setOrders(storeOrders);
        setProducts(storeProducts);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const validOrders = useMemo(() => orders.filter((order) => order.status !== "cancelled"), [orders]);
  const onlineOrders = useMemo(() => validOrders.filter((order) => order.source === "online"), [validOrders]);
  const offlineOrders = useMemo(() => validOrders.filter((order) => order.source === "offline"), [validOrders]);
  const onlineRevenue = useMemo(() => onlineOrders.reduce((sum, order) => sum + order.total, 0), [onlineOrders]);
  const offlineRevenue = useMemo(() => offlineOrders.reduce((sum, order) => sum + order.total, 0), [offlineOrders]);
  const totalRevenue = onlineRevenue + offlineRevenue;

  const salesTrend = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (13 - index));
      const key = date.toISOString().slice(0, 10);
      const dayOrders = validOrders.filter((order) => order.createdAt.slice(0, 10) === key);
      return {
        label: new Intl.DateTimeFormat("en-PK", { month: "short", day: "numeric" }).format(date),
        revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
        orders: dayOrders.length,
      };
    });
  }, [validOrders]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRevenue = useMemo(() => validOrders.filter((order) => order.createdAt.slice(0, 10) === todayKey).reduce((sum, order) => sum + order.total, 0), [validOrders, todayKey]);
  const maxRevenue = Math.max(...salesTrend.map((point) => point.revenue), 1);
  const uniqueCustomers = useMemo(() => new Set(validOrders.map((order) => order.phone || order.customerName)).size, [validOrders]);
  const averageOrderValue = useMemo(() => validOrders.length ? Math.round(totalRevenue / validOrders.length) : 0, [validOrders, totalRevenue]);
  const publishedProducts = useMemo(() => products.filter((product) => product.status === "published"), [products]);
  const topProducts = useMemo(() => {
    const tally = new Map<string, number>();
    validOrders.forEach((order) => order.items.forEach((item) => tally.set(item.name, (tally.get(item.name) || 0) + item.quantity)));
    return Array.from(tally.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [validOrders]);
  const lowStockProducts = useMemo(() => products.filter((product) => product.stock > 0 && product.stock <= 5), [products]);

  if (loading) return <Loader label="Loading analytics..." />;
  if (!store) return <div className="card p-8">Create your store first to unlock analytics.</div>;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Revenue", currency(totalRevenue)],
          ["Today Sales", currency(todayRevenue)],
          ["Orders", String(validOrders.length)],
          ["Receipts Issued", String(validOrders.filter((order) => Boolean(order.receiptNumber)).length)],
        ].map(([label, value]) => (
          <div key={label} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="card p-6">
          <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-pink-600" /><div><h2 className="text-xl font-bold text-slate-900">Daily sales dashboard</h2><p className="text-sm text-slate-500">Last 14 days of revenue and order activity.</p></div></div>
          <div className="mt-6 h-72 rounded-[1.5rem] bg-slate-50 p-4">
            <div className="grid h-full items-end gap-3" style={{ gridTemplateColumns: `repeat(${salesTrend.length}, minmax(0, 1fr))` }}>
              {salesTrend.map((point) => {
                const barHeight = point.revenue > 0 ? Math.max((point.revenue / maxRevenue) * 100, 12) : 6;
                return (
                  <div key={point.label} className="flex h-full min-w-0 flex-col justify-end gap-2">
                    <div className="flex h-full items-end justify-center">
                      <div className="group relative flex w-full items-end justify-center">
                        <div className="w-full rounded-t-2xl bg-gradient-to-t from-pink-600 via-fuchsia-500 to-pink-300" style={{ height: `${barHeight}%` }} />
                        <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-xl bg-slate-950 px-2 py-1 text-[11px] font-medium text-white group-hover:block">{currency(point.revenue)} • {point.orders} orders</div>
                      </div>
                    </div>
                    <div className="space-y-1 text-center"><div className="text-[11px] font-medium text-slate-500">{point.label}</div><div className="text-[10px] text-slate-400">{point.orders} ord</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3"><Wallet className="h-5 w-5 text-emerald-600" /><h2 className="text-xl font-bold text-slate-900">Cash vs online revenue</h2></div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Offline POS cash</p><p className="mt-2 text-2xl font-bold text-slate-900">{currency(offlineRevenue)}</p><p className="mt-1 text-xs text-slate-500">{offlineOrders.length} orders</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Online orders</p><p className="mt-2 text-2xl font-bold text-slate-900">{currency(onlineRevenue)}</p><p className="mt-1 text-xs text-slate-500">{onlineOrders.length} orders</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Average order value</p><p className="mt-2 text-2xl font-bold text-slate-900">{currency(averageOrderValue)}</p><p className="mt-1 text-xs text-slate-500">{uniqueCustomers} unique customers</p></div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3"><Receipt className="h-5 w-5 text-sky-600" /><h2 className="text-xl font-bold text-slate-900">Receipt & POS snapshot</h2></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><Package2 className="h-4 w-4" /> Published products</div><p className="mt-2 text-2xl font-bold text-slate-900">{publishedProducts.length}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm text-slate-500"><ShoppingCart className="h-4 w-4" /> Items sold</div><p className="mt-2 text-2xl font-bold text-slate-900">{topProducts.reduce((sum, [, qty]) => sum + qty, 0)}</p></div>
            </div>
            <div className="mt-4 space-y-3">
              {topProducts.length > 0 ? topProducts.map(([name, qty]) => <div key={name} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"><span className="font-medium text-slate-900">{name}</span><span className="text-sm text-slate-500">{qty} sold</span></div>) : <p className="text-slate-500">Top products will appear once more orders are placed.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-6">
          <div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-pink-600" /><div><h2 className="text-xl font-bold text-slate-900">Analytics actions</h2><p className="text-sm text-slate-500">Review products, storefront, or use Offline POS.</p></div></div>
          <div className="mt-4 flex flex-wrap gap-3"><Link href="/app/products" className="btn-primary">Review low stock products</Link><Link href="/app/pos" className="btn-secondary">Open Offline POS</Link><Link href={`/store/${store.slug}`} className="btn-secondary">Open storefront</Link></div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><h2 className="text-xl font-bold text-slate-900">Low stock alerts</h2></div>
          <div className="mt-4 space-y-3">{lowStockProducts.length > 0 ? lowStockProducts.map((product) => <div key={product.id} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{product.name} • {product.stock} left</div>) : <p className="text-slate-500">No critical low stock alerts right now.</p>}</div>
        </div>
      </section>
    </div>
  );
}
