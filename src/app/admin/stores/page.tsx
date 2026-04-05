"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader } from '@/components/ui/Loader';
import { getAllStoresForAdmin, updateStore } from '@/lib/services/stores';
import type { Store } from '@/types/store';

type StoreAdmin = Store & { ownerName: string; ownerEmail: string };

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setStores(await getAllStoresForAdmin() as StoreAdmin[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function changeStatus(store: StoreAdmin, next: NonNullable<Store['subscriptionStatus']>) {
    await updateStore(store.id, { subscriptionStatus: next });
    await load();
  }

  if (loading) return <Loader label="Loading stores..." />;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="badge">All stores</span>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Store subscriptions</h2>
        </div>
        <p className="text-sm text-slate-500">Manage trial, active, expired, and suspended stores.</p>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-3 pr-4">Store</th><th className="py-3 pr-4">Owner</th><th className="py-3 pr-4">City</th><th className="py-3 pr-4">Category</th><th className="py-3 pr-4">Subscription</th><th className="py-3 pr-4">Trial ends</th><th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-b border-slate-100 align-top">
                <td className="py-4 pr-4"><div className="font-semibold text-slate-900">{store.name}</div><div className="text-slate-500">/{store.slug}</div></td>
                <td className="py-4 pr-4"><div>{store.ownerName}</div><div className="text-slate-500">{store.ownerEmail}</div></td>
                <td className="py-4 pr-4">{store.city}, {store.country}</td>
                <td className="py-4 pr-4">{store.category}</td>
                <td className="py-4 pr-4"><span className="capitalize">{store.subscriptionStatus || 'trial'}</span></td>
                <td className="py-4 pr-4">{store.trialEndsAt ? new Date(store.trialEndsAt).toLocaleDateString() : '—'}</td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-secondary" onClick={() => changeStatus(store, 'active')}>Activate</button>
                    <button className="btn-secondary" onClick={() => changeStatus(store, 'expired')}>Expire</button>
                    <button className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700" onClick={() => changeStatus(store, 'suspended')}>Suspend</button>
                    <Link className="btn-secondary" href={`/store/${store.slug}`}>Open store</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
