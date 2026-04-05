"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStore } from "@/lib/services/stores";
import { useAuth } from "@/contexts/AuthContext";
import { STORE_CATEGORIES, DEFAULT_STORE_CATEGORY } from "@/lib/constants/storeCategories";

export function CreateStoreForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(DEFAULT_STORE_CATEGORY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setError("");
    setSubmitting(true);

    try {
      await createStore({ ownerId: user.uid, name, slug, description, phone, whatsapp, city, category });
      router.push("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create store.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-4xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900">Create your store</h2>
      <p className="mt-2 text-sm text-slate-500">Start instantly with a 30-day free trial. You can upload your payment proof later from the Billing page when you are ready to activate your monthly subscription.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Store name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Style Hub" required />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Store slug</label>
          <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="style-hub" required />
          <p className="mt-2 text-xs text-slate-500">This will be used for your storefront URL later.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" required />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">WhatsApp</label>
          <input className="input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+92 300 1234567" required />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Karachi" required />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Store category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as typeof DEFAULT_STORE_CATEGORY)}>
            {STORE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea className="input min-h-32 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers what you sell..." />
        </div>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Free trial starts immediately</h3>
            <p className="mt-1 text-sm text-slate-500">Create your store now, manage products and orders during your free trial, then submit payment proof later from Billing for activation after trial.</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-soft">
            <p className="font-semibold text-slate-900">Subscription pricing</p>
            <p className="mt-1">1 month free trial, then $10 / month or PKR 2,700 / month</p>
          </div>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Creating store..." : "Create Store"}</button>
      </div>
    </form>
  );
}
