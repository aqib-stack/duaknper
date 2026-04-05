"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Package, ShoppingBag, TrendingUp, Wallet, Star, Users, TicketPercent, Clock3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/client";
import { Loader } from "@/components/ui/Loader";
import { getProductsByStoreId } from "@/lib/services/products";
import { getOrdersByStoreId } from "@/lib/services/orders";
import { getStoreByOwnerId } from "@/lib/services/stores";
import type { Product } from "@/types/product";
import type { Order } from "@/types/order";

type UserDoc = {
  hasStore?: boolean;
  storeId?: string;
};

type DashboardStats = {
  products: number;
  publishedProducts: number;
  draftProducts: number;
  featuredProducts: number;
  orders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
};

type SalesPoint = {
  label: string;
  revenue: number;
  orders: number;
};

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat("en-PK", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildSalesSeries(orders: Order[]): SalesPoint[] {
  const today = new Date();
  const points: SalesPoint[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const sameDayOrders = orders.filter((order) => order.createdAt.slice(0, 10) === key && order.status !== "cancelled");

    points.push({
      label: formatDateShort(date.toISOString()),
      revenue: sameDayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: sameDayOrders.length,
    });
  }

  return points;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasStore, setHasStore] = useState(false);
  const [storeSlug, setStoreSlug] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    publishedProducts: 0,
    draftProducts: 0,
    featuredProducts: 0,
    orders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    revenue: 0,
  });

  useEffect(() => {
    async function loadUser() {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const data = snap.data() as UserDoc | undefined;
      const sellerHasStore = Boolean(data?.hasStore);
      setHasStore(sellerHasStore);

      if (sellerHasStore && data?.storeId) {
        const [storeProducts, storeOrders, store] = await Promise.all([
          getProductsByStoreId(data.storeId),
          getOrdersByStoreId(data.storeId),
          getStoreByOwnerId(user.uid),
        ]);

        setStoreSlug(store?.slug || "");
        setProducts(storeProducts);
        setOrders(storeOrders);
        setStats({
          products: storeProducts.length,
          publishedProducts: storeProducts.filter((product) => product.status === "published").length,
          draftProducts: storeProducts.filter((product) => product.status === "draft").length,
          featuredProducts: storeProducts.filter((product) => product.featured).length,
          orders: storeOrders.length,
          pendingOrders: storeOrders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status)).length,
          deliveredOrders: storeOrders.filter((order) => order.status === "delivered").length,
          revenue: storeOrders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0),
        });
      }

      setChecking(false);
    }

    loadUser();
  }, [user]);

  const salesSeries = useMemo(() => buildSalesSeries(orders), [orders]);
  const maxRevenue = Math.max(...salesSeries.map((point) => point.revenue), 1);

  const topProducts = useMemo(() => {
    const tally = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();

    orders
      .filter((order) => order.status !== "cancelled")
      .forEach((order) => {
        order.items.forEach((item) => {
          const current = tally.get(item.productId) || {
            id: item.productId,
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
          current.quantity += item.quantity;
          current.revenue += item.quantity * item.price;
          tally.set(item.productId, current);
        });
      });

    products.forEach((product) => {
      if (!tally.has(product.id)) {
        tally.set(product.id, { id: product.id, name: product.name, quantity: 0, revenue: 0 });
      }
    });

    return Array.from(tally.values())
      .sort((a, b) => {
        if (b.quantity !== a.quantity) return b.quantity - a.quantity;
        return b.revenue - a.revenue;
      })
      .slice(0, 5);
  }, [orders, products]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const uniqueCustomers = useMemo(() => new Set(orders.map((order) => order.phone)).size, [orders]);
  const repeatCustomers = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((order) => counts.set(order.phone, (counts.get(order.phone) || 0) + 1));
    return Array.from(counts.values()).filter((count) => count > 1).length;
  }, [orders]);
  const couponUsageCount = useMemo(() => orders.filter((order) => order.couponCode).length, [orders]);
  const averageOrderValue = stats.orders > 0 ? Math.round(stats.revenue / stats.orders) : 0;
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => map.set(product.category, (map.get(product.category) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [products]);

  if (checking) {
    return <Loader label="Loading your dashboard..." />;
  }

  if (!hasStore) {
    return (
      <div className="card p-8">
        <span className="badge">Step 1 of 2</span>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">You haven&apos;t created your store yet</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Create your first store to start adding products and receiving orders.
        </p>
        <div className="mt-6">
          <Link href="/app/create-store" className="btn-primary">
            Create Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Revenue", formatCurrency(stats.revenue), Wallet],
          ["Orders", String(stats.orders), ShoppingBag],
          ["Products", String(stats.products), Package],
          ["Pending Orders", String(stats.pendingOrders), Clock3],
        ].map(([label, value, Icon]) => {
          const LucideIcon = Icon as typeof Wallet;
          return (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-pink-50 p-3 text-pink-600">
                  <LucideIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Avg order value", formatCurrency(averageOrderValue), TrendingUp],
          ["Featured products", String(stats.featuredProducts), Star],
          ["Unique customers", String(uniqueCustomers), Users],
          ["Coupon usage", String(couponUsageCount), TicketPercent],
        ].map(([label, value, Icon]) => {
          const LucideIcon = Icon as typeof Wallet;
          return (
            <div key={label} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><LucideIcon className="h-5 w-5" /></div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900">Welcome to your seller dashboard</h3>
            <p className="mt-2 max-w-3xl text-slate-600">
              Phase 8 is now focused on coupons, featured products, customer accounts, delivery logic, order tracking, and better analytics.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/products" className="btn-primary">Manage Products</Link>
              {storeSlug ? <Link href={`/store/${storeSlug}`} className="btn-secondary">View Storefront</Link> : null}
              <Link href="/app/orders" className="btn-secondary">Manage Orders</Link>
              <Link href="/app/settings" className="btn-secondary">Store Settings</Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="badge">Sales overview</span>
                  <h3 className="mt-3 text-xl font-bold text-slate-900">Last 7 days revenue</h3>
                </div>
                <p className="text-sm text-slate-500">Track daily store performance</p>
              </div>

              <div className="mt-6 grid h-64 grid-cols-7 items-end gap-3">
                {salesSeries.map((point) => (
                  <div key={point.label} className="flex h-full flex-col justify-end gap-3">
                    <div className="flex h-full items-end justify-center">
                      <div
                        className="w-full rounded-t-2xl bg-gradient-to-t from-pink-600 to-fuchsia-400"
                        style={{ height: `${Math.max((point.revenue / maxRevenue) * 100, point.revenue > 0 ? 12 : 4)}%` }}
                        title={`${point.label}: ${formatCurrency(point.revenue)} from ${point.orders} orders`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-500">{point.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{point.orders} ord</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <span className="badge">Top items</span>
              <h3 className="mt-3 text-xl font-bold text-slate-900">Top selling products</h3>
              <p className="mt-2 text-sm text-slate-500">See which products are driving the most quantity and revenue.</p>

              <div className="mt-6 space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((item, index) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 font-semibold text-pink-700">#{index + 1}</div>
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.quantity} items sold</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">Top selling items will appear once customers place more orders.</div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="badge">Recent activity</span>
                <h3 className="mt-3 text-xl font-bold text-slate-900">Recent orders</h3>
              </div>
              <Link href="/app/orders" className="text-sm font-medium text-pink-600 hover:text-pink-700">View all orders</Link>
            </div>

            <div className="mt-6 space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-slate-900">Order #{order.id.slice(0, 8)}</p>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">{order.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{order.customerName} • {formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">Your recent orders will appear here once customers start buying.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <span className="badge">Store insights</span>
            <h3 className="mt-3 text-xl font-bold text-slate-900">Quick performance snapshot</h3>
            <div className="mt-6 space-y-4">
              {[
                { label: "Average order value", value: formatCurrency(averageOrderValue) },
                { label: "Delivered orders", value: `${stats.deliveredOrders} delivered` },
                { label: "Repeat customers", value: `${repeatCustomers} repeat` },
                { label: "Open order workload", value: `${stats.pendingOrders} active` },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <span className="badge">Category mix</span>
            <h3 className="mt-3 text-xl font-bold text-slate-900">Product categories</h3>
            <div className="mt-6 space-y-3">
              {categoryBreakdown.length > 0 ? categoryBreakdown.map(([category, count]) => (
                <div key={category} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="font-medium text-slate-900">{category}</span>
                  <span className="text-sm text-slate-500">{count} products</span>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-slate-500">Add products to see category insights.</div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
