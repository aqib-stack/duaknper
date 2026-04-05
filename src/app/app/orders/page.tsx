"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStoreByOwnerId } from "@/lib/services/stores";
import { getOrdersByStoreId, updateOrderStatus } from "@/lib/services/orders";
import type { Order, OrderStatus } from "@/types/order";
import { Loader } from "@/components/ui/Loader";

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processed" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const filterTabs: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processed" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  processing: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, OrderStatus>>({});
  const [savingId, setSavingId] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | OrderStatus>("all");

  async function loadOrders() {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const store = await getStoreByOwnerId(user.uid);
      if (!store) {
        setOrders([]);
        return;
      }

      const storeOrders = await getOrdersByStoreId(store.id);
      setOrders(storeOrders);
      setStatusDrafts(Object.fromEntries(storeOrders.map((order) => [order.id, order.status])) as Record<string, OrderStatus>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrders(); }, [user]);

  const summary = useMemo(() => ({
    total: orders.length,
    offline: orders.filter((order) => order.source === "offline").length,
    online: orders.filter((order) => order.source === "online").length,
    revenue: orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0),
  }), [orders]);

  const filteredOrders = useMemo(() => activeFilter === "all" ? orders : orders.filter((order) => order.status === activeFilter), [orders, activeFilter]);

  async function handleSaveStatus(orderId: string) {
    const status = statusDrafts[orderId];
    if (!status) return;
    setSavingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order status.");
    } finally {
      setSavingId("");
    }
  }

  if (loading) return <Loader label="Loading store orders..." />;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Orders", String(summary.total)],
          ["Offline POS", String(summary.offline)],
          ["Online Orders", String(summary.online)],
          ["Revenue", `Rs ${summary.revenue.toLocaleString()}`],
        ].map(([label, value]) => (
          <div key={label} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>
        ))}
      </section>

      <section className="card p-6">
        <div>
          <span className="badge">Orders</span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Manage store orders</h2>
          <p className="mt-2 text-slate-600">Online and offline POS orders both appear here with receipt numbers and payment method.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {filterTabs.map((tab) => {
            const count = tab.value === "all" ? orders.length : orders.filter((order) => order.status === tab.value).length;
            const active = activeFilter === tab.value;
            return (
              <button key={tab.value} type="button" onClick={() => setActiveFilter(tab.value)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-pink-600 bg-pink-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-pink-200 hover:text-pink-700"}`}>
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {error ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {filteredOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-slate-500">No orders found in this filter yet.</div>
        ) : (
          <div className="mt-6 space-y-5">
            {filteredOrders.map((order) => {
              const editableStatus = statusDrafts[order.id] || order.status;
              return (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{order.receiptNumber}</h3>
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[order.status]}`}>{statusOptions.find((option) => option.value === order.status)?.label || order.status}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${order.source === "offline" ? "bg-slate-900 text-white" : "bg-sky-50 text-sky-700"}`}>{order.source === "offline" ? "Offline POS" : "Online"}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Placed on {formatDate(order.createdAt)}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div><p className="text-xs uppercase tracking-wide text-slate-400">Customer</p><p className="mt-1 font-medium text-slate-900">{order.customerName || "Walk-in Customer"}</p></div>
                        <div><p className="text-xs uppercase tracking-wide text-slate-400">Phone</p><p className="mt-1 font-medium text-slate-900">{order.phone || "-"}</p></div>
                        <div><p className="text-xs uppercase tracking-wide text-slate-400">City</p><p className="mt-1 font-medium text-slate-900">{order.city || "-"}</p></div>
                        <div><p className="text-xs uppercase tracking-wide text-slate-400">Payment</p><p className="mt-1 font-medium uppercase text-slate-900">{order.paymentMethod}</p></div>
                        <div><p className="text-xs uppercase tracking-wide text-slate-400">Items</p><p className="mt-1 font-medium text-slate-900">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p></div>
                      </div>
                    </div>

                    <div className="w-full rounded-2xl bg-slate-50 p-4 lg:max-w-xs">
                      <p className="text-sm text-slate-500">Order total</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">Rs {order.total.toLocaleString()}</p>
                      <div className="mt-4 flex gap-2">
                        <select className="input py-2" value={editableStatus} onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [order.id]: e.target.value as OrderStatus }))}>
                          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <button type="button" disabled={savingId === order.id} onClick={() => handleSaveStatus(order.id)} className="btn-primary whitespace-nowrap">{savingId === order.id ? "Saving..." : "Save"}</button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Ordered items</p>
                      <div className="mt-3 space-y-3">
                        {order.items.map((item, index) => (
                          <div key={`${order.id}-${index}`} className="flex items-start justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-900">{item.name}</p>
                              {item.selectedVariants?.length ? <p className="mt-1 text-xs text-slate-500">{item.selectedVariants.map((variant) => `${variant.name}: ${variant.value}`).join(" • ")}</p> : null}
                              <p className="mt-1 text-xs text-slate-400">Qty {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-slate-900">Rs {(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between"><span>Subtotal</span><span>Rs {order.subtotal.toLocaleString()}</span></div>
                      <div className="mt-2 flex items-center justify-between"><span>Delivery</span><span>Rs {order.deliveryFee.toLocaleString()}</span></div>
                      <div className="mt-2 flex items-center justify-between"><span>Discount</span><span>- Rs {order.discountAmount.toLocaleString()}</span></div>
                      <div className="mt-3 border-t border-slate-200 pt-3 flex items-center justify-between font-semibold text-slate-900"><span>Total</span><span>Rs {order.total.toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
