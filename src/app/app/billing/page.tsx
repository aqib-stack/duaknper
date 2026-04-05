"use client";

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { getStoreByOwnerId, updateStore } from '@/lib/services/stores';
import { createPaymentProof, getPaymentProofsByStore } from '@/lib/services/paymentProofs';
import { uploadPaymentProof } from '@/lib/services/storage';
import type { Store } from '@/types/store';
import type { PaymentMethod, PaymentProof } from '@/types/subscription';

const PAYMENT_METHODS: PaymentMethod[] = ['Easypaisa', 'JazzCash', 'Bank Transfer', 'SadaPay/NayaPay', 'Wise'];

export default function BillingPage() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [form, setForm] = useState({ paymentMethod: 'Bank Transfer' as PaymentMethod, amount: '2700', transactionId: '', note: '' });
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const foundStore = await getStoreByOwnerId(user.uid);
    setStore(foundStore);
    if (foundStore) setProofs(await getPaymentProofsByStore(foundStore.id));
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  const billingMeta = useMemo(() => {
    const trialEnd = store?.trialEndsAt ? new Date(store.trialEndsAt) : null;
    const diff = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    return { trialDaysLeft: diff, monthlyUsd: 10, monthlyPkr: 2700 };
  }, [store]);

  async function submitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !store || !file) return;
    setSubmitting(true);
    setMessage('');
    setMessageType('success');
    try {
      const upload = await uploadPaymentProof({ ownerId: user.uid, storeId: store.id, file });
      await createPaymentProof({
        storeId: store.id,
        ownerId: user.uid,
        storeName: store.name,
        ownerName: user.displayName || 'Seller',
        ownerEmail: user.email || '',
        amount: Number(form.amount || 2700),
        currency: 'PKR',
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId,
        screenshotUrl: upload.imageUrl,
        screenshotPath: upload.imagePath,
        note: form.note,
      });
      await updateStore(store.id, { subscriptionStatus: 'pending_payment_review', paymentStatus: 'pending' });
      await updateDoc(doc(db, 'users', user.uid), { subscriptionStatus: 'pending_payment_review', updatedAt: new Date().toISOString() });
      setMessageType('success');
      setMessage('Payment proof submitted. Super admin will review it shortly.');
      setFile(null);
      setForm({ paymentMethod: 'Bank Transfer', amount: '2700', transactionId: '', note: '' });
      await load();
    } catch (error) {
      console.error(error);
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Unable to submit payment proof right now. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loader label="Loading billing..." />;
  if (!store) return <div className="card p-8">Create your store first to access billing.</div>;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Current plan', store.subscriptionPlan || 'Starter Plan'],
          ['Subscription status', store.subscriptionStatus || 'trial'],
          ['Trial days left', String(Math.max(0, billingMeta.trialDaysLeft))],
          ['Monthly fee', `$${billingMeta.monthlyUsd} / Rs ${billingMeta.monthlyPkr.toLocaleString()}`],
        ].map(([label, value]) => <div key={label} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900 capitalize">{value}</p></div>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <form onSubmit={submitProof} className="card p-6 space-y-5">
          <div>
            <span className="badge">Billing</span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Upload payment proof</h1>
            <p className="mt-2 text-slate-600">You get a 1 month free trial. After that, upload your monthly payment screenshot here for manual approval.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Payment method</label>
              <select className="input" value={form.paymentMethod} onChange={(e)=>setForm((p)=>({...p,paymentMethod:e.target.value as PaymentMethod}))}>{PAYMENT_METHODS.map((m)=><option key={m} value={m}>{m}</option>)}</select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Amount paid</label>
              <input type="number" className="input" value={form.amount} onChange={(e)=>setForm((p)=>({...p,amount:e.target.value}))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Transaction ID</label>
              <input className="input" value={form.transactionId} onChange={(e)=>setForm((p)=>({...p,transactionId:e.target.value}))} placeholder="TXN12345" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Payment screenshot</label>
              <input type="file" accept="image/*" className="input file:mr-3 file:rounded-xl file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-pink-700" onChange={(e)=>setFile(e.target.files?.[0] || null)} required />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
              <textarea className="input min-h-24" value={form.note} onChange={(e)=>setForm((p)=>({...p,note:e.target.value}))} placeholder="Optional note for admin review" />
            </div>
          </div>
          {message ? <div className={`rounded-xl px-4 py-3 text-sm ${messageType === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>{message}</div> : null}
          <button className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit payment proof'}</button>
        </form>

        <div className="card p-6">
          <span className="badge">Payment instructions</span>
          <h2 className="mt-3 text-xl font-bold text-slate-900">Manual subscription payments</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Easypaisa / JazzCash</p><p className="mt-1">0305-8427519</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Bank Transfer (Raast)</p><p className="mt-1">03058427519</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">Wise / International</p><p className="mt-1">Use Wise and upload the receipt screenshot after payment.</p></div>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current subscription</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 capitalize">{store.subscriptionStatus}</p>
            <p className="mt-2 text-sm text-slate-500">Trial ends: {store.trialEndsAt ? new Date(store.trialEndsAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <span className="badge">History</span>
        <h2 className="mt-3 text-xl font-bold text-slate-900">Payment submissions</h2>
        <div className="mt-5 space-y-3">
          {proofs.map((proof) => (
            <div key={proof.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{proof.paymentMethod} · Rs {proof.amount.toLocaleString()}</p>
                <p className="text-sm text-slate-500">{proof.transactionId} · {new Date(proof.submittedAt).toLocaleString()}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${proof.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : proof.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{proof.status}</span>
            </div>
          ))}
          {proofs.length === 0 ? <p className="text-sm text-slate-500">No payment proofs submitted yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
