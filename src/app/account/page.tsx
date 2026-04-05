"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Heart, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getOrdersByCustomerId } from "@/lib/services/orders";
import { useWishlist } from "@/contexts/WishlistContext";
import type { Order } from "@/types/order";
import { Loader } from "@/components/ui/Loader";

export default function AccountPage() {
  const { user, loading, userRole, logout } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");

  useEffect(() => {
    async function load() {
      if (!user) {
        setPageLoading(false);
        return;
      }
      const result = await getOrdersByCustomerId(user.uid);
      setOrders(result);
      setPageLoading(false);
    }
    if (!loading) load();
  }, [user, loading]);

  const stats = useMemo(() => ({
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
    activeOrders: orders.filter((order) => ["pending", "confirmed", "processing"].includes(order.status)).length,
    deliveredOrders: orders.filter((order) => order.status === "delivered").length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
      const matchesSearch = term
        ? [order.id, order.storeSlug, order.customerName, ...order.items.map((item) => item.name)]
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  if (loading || pageLoading) return <Loader label="Loading your account..." />;

  if (!user || userRole !== "customer") {
    return (
      <main className="container-app py-16">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Customer account required</h1>
          <p className="mt-3 text-slate-600">Please login with a customer account to view past orders.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/customer/login" className="btn-primary">Customer Login</Link>
            <Link href="/customer/signup" className="btn-secondary">Create Account</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-app py-10 space-y-6">
      <div className="card p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <h1 className="text-2xl font-bold text-slate-900">{user.displayName || user.email}</h1>
          <p className="mt-1 text-slate-600">View past orders, track deliveries, and revisit saved products.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/track-order" className="btn-secondary">Track an Order</Link>
          <button onClick={() => logout()} className="btn-secondary">Logout</button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Orders", String(stats.totalOrders)],
          ["Total Spent", `Rs ${stats.totalSpent.toLocaleString()}`],
          ["Active Orders", String(stats.activeOrders)],
          ["Delivered", String(stats.deliveredOrders)],
          ["Wishlist", String(wishlistItems.length)],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Orders</h2>
            <p className="mt-1 text-sm text-slate-500">Search by item, order ID, or store and filter by status.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-12" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders or items" />
            </div>
            <select className="input min-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="mt-6 text-slate-500">No orders found for the selected filters.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">Order #{order.id.slice(0, 8)}</h3>
                    <p className="mt-1 text-sm text-slate-500">{order.storeSlug} • {new Date(order.createdAt).toLocaleDateString("en-PK")} • <span className="capitalize">{order.status}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">Rs {order.total.toLocaleString()}</p>
                    <Link href={`/track-order?orderId=${order.id}&phone=${encodeURIComponent(order.phone)}`} className="mt-1 inline-block text-sm font-medium text-pink-600">Track status</Link>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-2 text-sm text-slate-600">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.productId}-${item.name}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                        <span className="font-medium text-slate-900">{item.name}</span> × {item.quantity}
                        {item.selectedVariants?.length ? <span className="ml-2 text-xs text-slate-500">({item.selectedVariants.map((variant) => `${variant.name}: ${variant.value}`).join(" • ")})</span> : null}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>Payment: <span className="font-medium text-slate-900 uppercase">{order.paymentMethod}</span></p>
                    <p className="mt-2">Coupon: <span className="font-medium text-slate-900">{order.couponCode || "—"}</span></p>
                    <p className="mt-2">Discount: <span className="font-medium text-slate-900">Rs {order.discountAmount.toLocaleString()}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-pink-600" />
          <h2 className="text-xl font-bold text-slate-900">Wishlist snapshot</h2>
        </div>
        {wishlistItems.length === 0 ? (
          <p className="mt-4 text-slate-500">No saved items yet. Use the heart button on storefront products to build your wishlist.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {wishlistItems.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.category}</p>
                <p className="mt-3 text-lg font-bold text-slate-900">Rs {item.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
