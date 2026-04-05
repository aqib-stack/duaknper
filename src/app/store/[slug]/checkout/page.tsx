"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader } from "@/components/ui/Loader";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { CartSummary } from "@/components/storefront/CartSummary";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { useStoreCart } from "@/contexts/StoreCartContext";
import { createOrder } from "@/lib/services/orders";
import { findActiveCoupon, calculateCouponDiscount } from "@/lib/services/coupons";
import { getStoreBySlug } from "@/lib/services/stores";
import { useAuth } from "@/contexts/AuthContext";
import type { Store } from "@/types/store";
import type { Coupon } from "@/types/coupon";

export default function CheckoutPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { items, subtotal, totalItems, clearCart, appliedCoupon, setAppliedCoupon } = useStoreCart();
  const { user, userRole } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || "");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponStatus, setCouponStatus] = useState<"success" | "error" | "info" | "">("");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    async function loadStore() {
      if (!slug) return;
      setLoading(true);
      const foundStore = await getStoreBySlug(slug);
      setStore(foundStore);
      if (foundStore?.city) setForm((prev) => ({ ...prev, city: prev.city || foundStore.city }));
      setLoading(false);
    }
    loadStore();
  }, [slug]);

  useEffect(() => {
    if (user && userRole === "customer") {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.displayName || "",
        customerEmail: prev.customerEmail || user.email || "",
      }));
    }
  }, [user, userRole]);

  useEffect(() => {
    async function hydrateCouponFromCart() {
      if (!store || !appliedCoupon?.code) return;
      const found = await findActiveCoupon(store.id, appliedCoupon.code);
      if (found) {
        setCoupon(found);
        setCouponCode(found.code);
        setCouponStatus("success");
        setCouponMessage(`Coupon ${found.code} applied from cart drawer.`);
      }
    }
    hydrateCouponFromCart();
  }, [store, appliedCoupon]);

  const deliveryFee = useMemo(() => {
    if (!store) return 0;
    const threshold = store.freeDeliveryThreshold || 0;
    if (threshold > 0 && subtotal >= threshold) return 0;
    return store.deliveryCharge || 0;
  }, [store, subtotal]);

  const discountAmount = useMemo(() => {
    if (coupon) return calculateCouponDiscount(subtotal, coupon);
    return appliedCoupon?.discountAmount || 0;
  }, [subtotal, coupon, appliedCoupon]);
  const total = subtotal + deliveryFee - discountAmount;

  async function handleApplyCoupon() {
    if (!store || !store.enableCoupons) return;
    setCouponMessage("");
    const found = await findActiveCoupon(store.id, couponCode);
    if (!found) {
      setCoupon(null);
      setAppliedCoupon(null);
      setCouponStatus("error");
      setCouponMessage("Coupon not found or inactive.");
      return;
    }
    const discount = calculateCouponDiscount(subtotal, found);
    if (discount <= 0) {
      setCoupon(null);
      setAppliedCoupon(null);
      setCouponStatus("error");
      setCouponMessage(`Coupon requires minimum order of Rs ${(found.minimumOrder || 0).toLocaleString()}.`);
      return;
    }
    setCoupon(found);
    setAppliedCoupon({ code: found.code, discountAmount: discount });
    setCouponStatus("success");
    setCouponMessage(`Coupon ${found.code} applied successfully.`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!store) return;
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if ((store.minimumOrderAmount || 0) > subtotal) {
      setError(`Minimum order for this store is Rs ${(store.minimumOrderAmount || 0).toLocaleString()}.`);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const order = await createOrder({
        storeId: store.id,
        storeSlug: store.slug,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerId: userRole === "customer" ? user?.uid || "" : "",
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl || "",
          selectedVariants: item.selectedVariants || [],
        })),
        subtotal,
        deliveryFee,
        discountAmount,
        couponCode: coupon?.code || appliedCoupon?.code || "",
        total,
        paymentMethod: "cod",
      });
      clearCart();
      setOrderId(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loader label="Loading checkout..." />;
  if (!store) return <div className="container-app py-16 text-slate-600">Store not found.</div>;

  if (orderId) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fff_220px,#f8fafc_220px,#f8fafc_100%)]">
        <StoreHeader store={store} totalItems={0} />
        <div className="container-app py-12">
          <div className="card mx-auto max-w-2xl p-8 text-center">
            <span className="badge">Order placed</span>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Thank you for your order</h1>
            <p className="mt-3 text-slate-600">Your Cash on Delivery order has been submitted successfully.</p>
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">Order ID: {orderId}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={`/store/${store.slug}`} className="btn-primary">Continue Shopping</Link>
              <Link href={`/track-order?orderId=${orderId}`} className="btn-secondary">Track Order</Link>
            </div>
          </div>
        </div>
        <StoreFooter store={store} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fff_220px,#f8fafc_220px,#f8fafc_100%)]">
      <StoreHeader store={store} totalItems={totalItems} />
      <div className="container-app py-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <form onSubmit={handleSubmit} className="card p-6">
            <span className="badge">Checkout</span>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Complete your order</h1>
            <p className="mt-2 text-slate-600">Payment method: Cash on Delivery</p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {store.minimumOrderAmount ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Minimum order: <span className="font-semibold">Rs {store.minimumOrderAmount.toLocaleString()}</span></div> : null}
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Delivery fee: <span className="font-semibold">Rs {deliveryFee.toLocaleString()}</span></div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Estimated delivery: <span className="font-semibold">{store.deliveryEstimate || "Same day or next day"}</span></div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                <input className="input" value={form.customerName} onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email (optional)</label>
                <input type="email" className="input" value={form.customerEmail} onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
                <input className="input" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
                <input className="input" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} required />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Delivery address</label>
                <textarea className="input min-h-28 resize-y" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} required />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Order notes (optional)</label>
                <textarea className="input min-h-24 resize-y" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-slate-200 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Discount coupon</label>
                <div className="flex gap-3">
                  <input className="input" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" />
                  <button type="button" className="btn-secondary whitespace-nowrap" onClick={handleApplyCoupon} disabled={!store.enableCoupons}>Apply</button>
                </div>
                {couponMessage ? <div className={`mt-2 rounded-xl px-3 py-2 text-sm ${couponStatus === "success" ? "bg-emerald-50 text-emerald-700" : couponStatus === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>{couponMessage}</div> : null}
              </div>
            </div>

            {error ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>Rs {subtotal.toLocaleString()}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>Delivery</span><span>Rs {deliveryFee.toLocaleString()}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>Discount</span><span>- Rs {discountAmount.toLocaleString()}</span></div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 font-semibold text-slate-900"><span>Total</span><span>Rs {total.toLocaleString()}</span></div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" disabled={submitting || items.length === 0} className="btn-primary">
                {submitting ? "Placing order..." : `Place COD Order • Rs ${total.toLocaleString()}`}
              </button>
              <Link href={`/store/${store.slug}`} className="btn-secondary">Back to Store</Link>
            </div>
          </form>

          <div className="xl:sticky xl:top-36 xl:self-start">
            <CartSummary storeSlug={store.slug} compact deliveryFee={deliveryFee} freeDeliveryThreshold={store.freeDeliveryThreshold || 0} />
          </div>
        </div>
      </div>
      <StoreFooter store={store} />
    </main>
  );
}
