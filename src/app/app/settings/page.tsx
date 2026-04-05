"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/Loader";
import { getStoreByOwnerId, updateStore } from "@/lib/services/stores";
import { createCoupon, deleteCoupon, getCouponsByStoreId, updateCoupon } from "@/lib/services/coupons";
import type { Store } from "@/types/store";
import type { Coupon } from "@/types/coupon";
import { STORE_CATEGORIES, DEFAULT_STORE_CATEGORY } from "@/lib/constants/storeCategories";

export default function SettingsPage() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [couponForm, setCouponForm] = useState({ code: "", type: "percentage" as "percentage" | "fixed", value: "", minimumOrder: "" });
  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    whatsapp: "",
    supportEmail: "",
    country: "Pakistan",
    city: "",
    category: DEFAULT_STORE_CATEGORY,
    address: "",
    deliveryCharge: "0",
    freeDeliveryThreshold: "0",
    minimumOrderAmount: "0",
    deliveryEstimate: "",
    announcementText: "",
    heroTitle: "",
    heroSubtitle: "",
    featuredSectionTitle: "",
    featuredSectionSubtitle: "",
    enableCoupons: true,
    enableOrderTracking: true,
  });

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const foundStore = await getStoreByOwnerId(user.uid);
    setStore(foundStore);
    if (foundStore) {
      setForm({
        name: foundStore.name || "",
        description: foundStore.description || "",
        phone: foundStore.phone || "",
        whatsapp: foundStore.whatsapp || "",
        supportEmail: foundStore.supportEmail || "",
        country: foundStore.country || "Pakistan",
        city: foundStore.city || "",
        category: foundStore.category || DEFAULT_STORE_CATEGORY,
        address: foundStore.address || "",
        deliveryCharge: String(foundStore.deliveryCharge || 0),
        freeDeliveryThreshold: String(foundStore.freeDeliveryThreshold || 0),
        minimumOrderAmount: String(foundStore.minimumOrderAmount || 0),
        deliveryEstimate: foundStore.deliveryEstimate || "",
        announcementText: foundStore.announcementText || "",
        heroTitle: foundStore.heroTitle || "",
        heroSubtitle: foundStore.heroSubtitle || "",
        featuredSectionTitle: foundStore.featuredSectionTitle || "",
        featuredSectionSubtitle: foundStore.featuredSectionSubtitle || "",
        enableCoupons: foundStore.enableCoupons !== false,
        enableOrderTracking: foundStore.enableOrderTracking !== false,
      });
      setCoupons(await getCouponsByStoreId(foundStore.id));
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [user]);

  const couponsStats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter((coupon) => coupon.isActive).length,
    fixed: coupons.filter((coupon) => coupon.type === "fixed").length,
    percentage: coupons.filter((coupon) => coupon.type === "percentage").length,
  }), [coupons]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    setMessage("");
    await updateStore(store.id, {
      name: form.name,
      description: form.description,
      phone: form.phone,
      whatsapp: form.whatsapp,
      supportEmail: form.supportEmail,
      country: form.country,
      city: form.city,
      category: form.category,
      address: form.address,
      deliveryCharge: Number(form.deliveryCharge || 0),
      freeDeliveryThreshold: Number(form.freeDeliveryThreshold || 0),
      minimumOrderAmount: Number(form.minimumOrderAmount || 0),
      deliveryEstimate: form.deliveryEstimate,
      announcementText: form.announcementText,
      heroTitle: form.heroTitle,
      heroSubtitle: form.heroSubtitle,
      featuredSectionTitle: form.featuredSectionTitle,
      featuredSectionSubtitle: form.featuredSectionSubtitle,
      enableCoupons: form.enableCoupons,
      enableOrderTracking: form.enableOrderTracking,
    });
    setSaving(false);
    setMessage("Store settings updated successfully.");
    await loadData();
  }

  async function addCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return;
    await createCoupon({
      storeId: store.id,
      code: couponForm.code,
      type: couponForm.type,
      value: Number(couponForm.value || 0),
      minimumOrder: Number(couponForm.minimumOrder || 0),
      isActive: true,
    });
    setCouponForm({ code: "", type: "percentage", value: "", minimumOrder: "" });
    setCoupons(await getCouponsByStoreId(store.id));
  }

  async function toggleCoupon(coupon: Coupon) {
    await updateCoupon(coupon.id, { isActive: !coupon.isActive });
    if (store) setCoupons(await getCouponsByStoreId(store.id));
  }

  async function removeCoupon(couponId: string) {
    await deleteCoupon(couponId);
    if (store) setCoupons(await getCouponsByStoreId(store.id));
  }

  if (loading) return <Loader label="Loading store settings..." />;
  if (!store) return <div className="card p-8">Create your store first to manage premium settings.</div>;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Coupons", String(couponsStats.total)],
          ["Active coupons", String(couponsStats.active)],
          ["Fixed discounts", String(couponsStats.fixed)],
          ["Percentage discounts", String(couponsStats.percentage)],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <form onSubmit={saveSettings} className="card p-6 space-y-6">
        <div>
          <span className="badge">Premium settings</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Storefront and delivery settings</h1>
          <p className="mt-2 text-slate-600">Control store profile, checkout delivery fees, coupons, and order tracking.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            ["Store name", "name"], ["Phone", "phone"], ["WhatsApp", "whatsapp"], ["Support email", "supportEmail"], ["Country", "country"], ["City", "city"],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
              <input className="input" value={(form as Record<string,string|boolean>)[key] as string} onChange={(e)=>setForm((prev)=>({...prev,[key]:e.target.value}))} />
            </div>
          ))}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Store category</label>
            <select className="input" value={form.category} onChange={(e)=>setForm((prev)=>({...prev,category:e.target.value as typeof DEFAULT_STORE_CATEGORY}))}>
              {STORE_CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Store description</label>
            <textarea className="input min-h-24" value={form.description} onChange={(e)=>setForm((prev)=>({...prev,description:e.target.value}))} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
            <textarea className="input min-h-24" value={form.address} onChange={(e)=>setForm((prev)=>({...prev,address:e.target.value}))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Delivery charge</label>
            <input type="number" className="input" value={form.deliveryCharge} onChange={(e)=>setForm((prev)=>({...prev,deliveryCharge:e.target.value}))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Free delivery threshold</label>
            <input type="number" className="input" value={form.freeDeliveryThreshold} onChange={(e)=>setForm((prev)=>({...prev,freeDeliveryThreshold:e.target.value}))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Minimum order amount</label>
            <input type="number" className="input" value={form.minimumOrderAmount} onChange={(e)=>setForm((prev)=>({...prev,minimumOrderAmount:e.target.value}))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Delivery estimate</label>
            <input className="input" value={form.deliveryEstimate} onChange={(e)=>setForm((prev)=>({...prev,deliveryEstimate:e.target.value}))} placeholder="Same day in Karachi" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Announcement bar text</label>
            <input className="input" value={form.announcementText} onChange={(e)=>setForm((prev)=>({...prev,announcementText:e.target.value}))} placeholder="Free delivery this weekend on selected products" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Hero title</label>
            <input className="input" value={form.heroTitle} onChange={(e)=>setForm((prev)=>({...prev,heroTitle:e.target.value}))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Hero subtitle</label>
            <input className="input" value={form.heroSubtitle} onChange={(e)=>setForm((prev)=>({...prev,heroSubtitle:e.target.value}))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Featured section title</label>
            <input className="input" value={form.featuredSectionTitle} onChange={(e)=>setForm((prev)=>({...prev,featuredSectionTitle:e.target.value}))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Featured section subtitle</label>
            <input className="input" value={form.featuredSectionSubtitle} onChange={(e)=>setForm((prev)=>({...prev,featuredSectionSubtitle:e.target.value}))} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.enableCoupons} onChange={(e)=>setForm((prev)=>({...prev,enableCoupons:e.target.checked}))} /> Enable coupons</label>
          <label className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.enableOrderTracking} onChange={(e)=>setForm((prev)=>({...prev,enableOrderTracking:e.target.checked}))} /> Enable order tracking</label>
        </div>
        {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
      </form>

      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="badge">Coupon manager</span>
            <h2 className="mt-3 text-xl font-bold text-slate-900">Discount coupons</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Create discount codes for your storefront checkout, activate or pause campaigns, and give shoppers a clear incentive to convert.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[380px]">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Live coupons</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{couponsStats.active}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Best for</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{form.enableCoupons ? "Checkout boosts" : "Enable coupons first"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Average setup</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Code + value + minimum order</p>
            </div>
          </div>
        </div>

        <form onSubmit={addCoupon} className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Coupon code</label>
              <input className="input" placeholder="RAMZAN10" value={couponForm.code} onChange={(e)=>setCouponForm((prev)=>({...prev,code:e.target.value.toUpperCase()}))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Discount type</label>
              <select className="input" value={couponForm.type} onChange={(e)=>setCouponForm((prev)=>({...prev,type:e.target.value as "percentage"|"fixed"}))}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Value</label>
              <input type="number" className="input" placeholder={couponForm.type === "percentage" ? "10" : "250"} value={couponForm.value} onChange={(e)=>setCouponForm((prev)=>({...prev,value:e.target.value}))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Minimum order</label>
              <input type="number" className="input" placeholder="1500" value={couponForm.minimumOrder} onChange={(e)=>setCouponForm((prev)=>({...prev,minimumOrder:e.target.value}))} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Tip: percentage works well for promotions, fixed discounts work well for COD conversion offers.</p>
            <button className="btn-primary" disabled={!form.enableCoupons}>{form.enableCoupons ? "Create Coupon" : "Enable coupons in settings first"}</button>
          </div>
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Coupon code</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{coupon.code}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${coupon.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{coupon.isActive ? "Active" : "Paused"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="badge">{coupon.type === "percentage" ? `${coupon.value}% off` : `Rs ${coupon.value} off`}</span>
                <span className="badge">Min order Rs {(coupon.minimumOrder || 0).toLocaleString()}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Type</p>
                  <p className="mt-1 font-semibold text-slate-900">{coupon.type === "percentage" ? "Percentage" : "Fixed"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Discount</p>
                  <p className="mt-1 font-semibold text-slate-900">{coupon.type === "percentage" ? `${coupon.value}%` : `Rs ${coupon.value}`}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => toggleCoupon(coupon)}>{coupon.isActive ? "Pause coupon" : "Activate coupon"}</button>
                <button type="button" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700" onClick={() => removeCoupon(coupon.id)}>Delete</button>
              </div>
            </div>
          ))}
          {coupons.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center md:col-span-2 xl:col-span-3">
              <p className="text-lg font-semibold text-slate-900">No coupons created yet</p>
              <p className="mt-2 text-slate-500">Create your first offer to increase checkout conversions and repeat orders.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
