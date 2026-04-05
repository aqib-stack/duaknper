"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, TicketPercent, Truck, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useStoreCart } from "@/contexts/StoreCartContext";
import { getStoreBySlug } from "@/lib/services/stores";
import { calculateCouponDiscount, findActiveCoupon } from "@/lib/services/coupons";
import type { Store } from "@/types/store";

type CartSummaryProps = {
  storeSlug: string;
  compact?: boolean;
  floating?: boolean;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
};

export function CartSummary({
  storeSlug,
  compact = false,
  floating = false,
  deliveryFee = 0,
  freeDeliveryThreshold = 0,
}: CartSummaryProps) {
  const { items, increaseQty, decreaseQty, removeItem, subtotal, totalItems, appliedCoupon, setAppliedCoupon } = useStoreCart();
  const [store, setStore] = useState<Store | null>(null);
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || "");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponStatus, setCouponStatus] = useState<"success" | "error" | "info" | "">("");
  const disabledCheckout = items.length === 0;
  const thresholdRemaining = Math.max(freeDeliveryThreshold - subtotal, 0);
  const hasFreeDeliveryOffer = freeDeliveryThreshold > 0;
  const qualifiesFreeDelivery = hasFreeDeliveryOffer && subtotal >= freeDeliveryThreshold;
  const estimatedTotal = subtotal + deliveryFee - (appliedCoupon?.discountAmount || 0);

  useEffect(() => {
    async function loadStore() {
      const foundStore = await getStoreBySlug(storeSlug);
      setStore(foundStore);
    }
    loadStore();
  }, [storeSlug]);

  useEffect(() => {
    setCouponCode(appliedCoupon?.code || "");
  }, [appliedCoupon]);

  useEffect(() => {
    async function refreshAppliedCoupon() {
      if (!store || !appliedCoupon?.code) return;
      const found = await findActiveCoupon(store.id, appliedCoupon.code);
      if (!found) {
        setAppliedCoupon(null);
        return;
      }
      const nextDiscount = calculateCouponDiscount(subtotal, found);
      if (nextDiscount <= 0) {
        setAppliedCoupon(null);
        setCouponStatus("info");
        setCouponMessage(`Coupon ${found.code} removed because the minimum order is no longer met.`);
        return;
      }
      setAppliedCoupon({ code: found.code, discountAmount: nextDiscount });
    }
    refreshAppliedCoupon();
  }, [store, subtotal]);

  async function handleApplyCoupon() {
    if (!store || !store.enableCoupons) return;
    const found = await findActiveCoupon(store.id, couponCode);
    if (!found) {
      setAppliedCoupon(null);
      setCouponStatus("error");
      setCouponMessage("Coupon not found or inactive.");
      return;
    }
    const discountAmount = calculateCouponDiscount(subtotal, found);
    if (discountAmount <= 0) {
      setAppliedCoupon(null);
      setCouponStatus("error");
      setCouponMessage(`Coupon requires minimum order of Rs ${(found.minimumOrder || 0).toLocaleString()}.`);
      return;
    }
    setAppliedCoupon({ code: found.code, discountAmount });
    setCouponStatus("success");
    setCouponMessage(`Coupon ${found.code} applied to cart.`);
  }

  const couponEnabled = useMemo(() => Boolean(store?.enableCoupons), [store]);

  function removeAppliedCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponStatus("");
    setCouponMessage("");
  }

  return (
    <aside className={`card p-6 ${floating ? "border-slate-950 shadow-2xl" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="badge">Cart</span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Your order</h2>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          {totalItems} item{totalItems === 1 ? "" : "s"}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
          Your cart is empty. Add some products from the storefront.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.key} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">Rs {item.price.toLocaleString()} each</p>
                    {item.selectedVariants?.length ? (
                      <p className="mt-1 text-xs text-slate-500">{item.selectedVariants.map((v) => `${v.name}: ${v.value}`).join(" • ")}</p>
                    ) : null}
                  </div>
                </div>
                <button type="button" className="text-sm font-medium text-rose-600" onClick={() => removeItem(item.key)}>
                  Remove
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
                  <button type="button" className="text-lg font-semibold text-slate-700" onClick={() => decreaseQty(item.key)}>
                    −
                  </button>
                  <span className="min-w-5 text-center text-sm font-medium text-slate-900">{item.quantity}</span>
                  <button
                    type="button"
                    className="text-lg font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => increaseQty(item.key)}
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </button>
                </div>
                <p className="font-semibold text-slate-900">Rs {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {couponEnabled ? (
        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><TicketPercent className="h-4 w-4 text-violet-600" /> Coupon apply box</div>
          <div className="mt-3 flex gap-3">
            <input className="input" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Apply coupon" />
            <button type="button" className="btn-secondary whitespace-nowrap" onClick={handleApplyCoupon}>Apply</button>
          </div>
          {couponMessage ? (
            <div className={`mt-3 flex items-start gap-2 rounded-2xl px-3 py-2 text-sm ${couponStatus === "success" ? "bg-emerald-50 text-emerald-700" : couponStatus === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
              {couponStatus === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : couponStatus === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <TicketPercent className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{couponMessage}</span>
            </div>
          ) : null}
          {appliedCoupon ? (
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-emerald-700"><TicketPercent className="h-4 w-4" /> Applied: {appliedCoupon.code}</span>
              <button type="button" className="inline-flex items-center gap-1 text-rose-600" onClick={removeAppliedCoupon}>
                <X className="h-4 w-4" /> Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasFreeDeliveryOffer ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> Free delivery offer</div>
          <p className="mt-2">
            {qualifiesFreeDelivery
              ? "You unlocked free delivery for this order."
              : `Add Rs ${thresholdRemaining.toLocaleString()} more to get free delivery.`}
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">Rs {subtotal.toLocaleString()}</span>
        </div>
        {appliedCoupon ? (
          <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
            <span>Coupon ({appliedCoupon.code})</span>
            <span className="font-semibold text-emerald-700">- Rs {appliedCoupon.discountAmount.toLocaleString()}</span>
          </div>
        ) : null}
        {!compact ? (
          <>
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <span>Estimated delivery</span>
              <span className="font-semibold text-slate-900">Rs {deliveryFee.toLocaleString()}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
              <span>Estimated total</span>
              <span>Rs {estimatedTotal.toLocaleString()}</span>
            </div>
          </>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={disabledCheckout ? `#products` : `/store/${storeSlug}/checkout`}
            className={`btn-primary flex-1 ${disabledCheckout ? "pointer-events-none opacity-60" : ""}`}
            aria-disabled={disabledCheckout}
          >
            Proceed to Checkout
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
