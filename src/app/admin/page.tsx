"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllStoresForAdmin } from '@/lib/services/stores';
import { getAllPaymentProofs } from '@/lib/services/paymentProofs';
import { Loader } from '@/components/ui/Loader';
import type { PaymentProof } from '@/types/subscription';
import type { Store } from '@/types/store';

type StoreAdmin = Store & { ownerName: string; ownerEmail: string };

export default function AdminDashboardPage() {
  const [stores, setStores] = useState<StoreAdmin[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setStores(await getAllStoresForAdmin() as StoreAdmin[]);
      setProofs(await getAllPaymentProofs());
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const active = stores.filter((s) => s.subscriptionStatus === 'active').length;
    const trial = stores.filter((s) => s.subscriptionStatus === 'trial').length;
    const expired = stores.filter((s) => s.subscriptionStatus === 'expired').length;
    const pending = proofs.filter((p) => p.status === 'pending').length;
    return {
      total: stores.length,
      active,
      trial,
      expired,
      pending,
      mrrUsd: active * 10,
      mrrPkr: active * 2700,
    };
  }, [proofs, stores]);

  if (loading) return <Loader label="Loading super admin dashboard..." />;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          ['Total stores', String(stats.total)],
          ['Active subscriptions', String(stats.active)],
          ['Trial stores', String(stats.trial)],
          ['Expired stores', String(stats.expired)],
          ['Pending proofs', String(stats.pending)],
          ['MRR', `$${stats.mrrUsd} / Rs ${stats.mrrPkr.toLocaleString()}`],
        ].map(([label, value]) => <div key={label} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="badge">Store overview</span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Latest stores</h2>
            </div>
            <Link className="btn-secondary" href="/admin/stores">View all stores</Link>
          </div>
          <div className="mt-5 space-y-3">
            {stores.slice(0,5).map((store) => (
              <div key={store.id} className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{store.name}</p>
                  <p className="text-sm text-slate-500">{store.ownerName} · {store.city}, {store.country}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 capitalize">{store.subscriptionStatus || 'trial'}</p>
                  <p className="text-xs text-slate-500">Trial ends {store.trialEndsAt ? new Date(store.trialEndsAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="badge">Payment review</span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Pending submissions</h2>
            </div>
            <Link className="btn-secondary" href="/admin/payment-proofs">Review proofs</Link>
          </div>
          <div className="mt-5 space-y-3">
            {proofs.slice(0,5).map((proof) => (
              <div key={proof.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{proof.storeName}</p>
                    <p className="text-sm text-slate-500">{proof.paymentMethod} · {proof.transactionId || 'No transaction ID'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${proof.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : proof.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{proof.status}</span>
                </div>
              </div>
            ))}
            {proofs.length === 0 ? <p className="text-sm text-slate-500">No payment proofs submitted yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
