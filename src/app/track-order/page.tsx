"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CircleCheckBig,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getOrderById } from "@/lib/services/orders";
import type { Order } from "@/types/order";

const statusSteps = ["pending", "confirmed", "processing", "delivered"] as const;

const iconMap: Record<Order["status"], LucideIcon> = {
  pending: ShoppingBag,
  confirmed: CircleCheckBig,
  processing: PackageCheck,
  delivered: Truck,
  cancelled: XCircle,
  completed: CircleCheckBig,
};

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookupOrder(currentOrderId: string, currentPhone: string) {
    setLoading(true);
    setError("");
    setOrder(null);

    const result = await getOrderById(currentOrderId.trim());

    if (!result || result.phone !== currentPhone.trim()) {
      setError("No matching order found for this ID and phone number.");
      setLoading(false);
      return;
    }

    setOrder(result);
    setLoading(false);
  }

  useEffect(() => {
    if (orderId && phone) {
      lookupOrder(orderId, phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await lookupOrder(orderId, phone);
  }

  const currentStep = useMemo(() => {
    if (!order) return -1;
    if (order.status === "cancelled") return -1;
    if (order.status === "completed") return statusSteps.length - 1;

    return Math.max(0, statusSteps.indexOf(order.status as (typeof statusSteps)[number]));
  }, [order]);

  const StatusIcon = order ? iconMap[order.status] ?? ShoppingBag : ShoppingBag;

  return (
    <main className="container-app py-12 space-y-6">
      <div className="card mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-900">Track your order</h1>
        <p className="mt-2 text-slate-600">Enter your order ID and phone number used at checkout.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button className="btn-primary sm:col-span-2" disabled={loading}>
            {loading ? "Checking..." : "Track Order"}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      {order ? (
        <div className="card mx-auto max-w-4xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-sm font-medium text-pink-700">
                <StatusIcon className="h-4 w-4" />
                <span className="capitalize">{order.status}</span>
              </div>
              <h2 className="mt-3 text-xl font-bold text-slate-900">Order #{order.id.slice(0, 8)}</h2>
              <p className="mt-1 text-slate-500">Store: {order.storeSlug}</p>
            </div>
            <p className="font-semibold text-slate-900">Rs {order.total.toLocaleString()}</p>
          </div>

          {order.status !== "cancelled" ? (
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {statusSteps.map((step, index) => (
                <div
                  key={step}
                  className={`rounded-2xl border p-4 text-center ${
                    index <= currentStep
                      ? "border-pink-200 bg-pink-50 text-pink-700"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  <p className="text-sm font-medium capitalize">{step}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              This order has been cancelled.
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Delivery address</p>
              <p className="mt-2 font-medium text-slate-900">{order.address}</p>
              <p className="mt-1 text-sm text-slate-600">
                {order.city} • {order.phone}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Order summary</p>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>Rs {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span>Rs {order.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>- Rs {order.discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                  <span>Total</span>
                  <span>Rs {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Items in this order</h3>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div
                  key={`${item.productId}-${item.name}`}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {item.selectedVariants?.length ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.selectedVariants
                          .map((variant) => `${variant.name}: ${variant.value}`)
                          .join(" • ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-700">
                    {item.quantity} × Rs {item.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}