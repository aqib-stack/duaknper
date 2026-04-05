"use client";

import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/ui/Loader';
import { db } from '@/lib/firebase/client';
import { getAllPaymentProofs, updatePaymentProofStatus } from '@/lib/services/paymentProofs';
import { getStoreById, updateStore } from '@/lib/services/stores';
import type { PaymentProof } from '@/types/subscription';

export default function AdminPaymentProofsPage() {
  const { user } = useAuth();
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setProofs(await getAllPaymentProofs());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function review(proof: PaymentProof, status: 'approved' | 'rejected') {
    await updatePaymentProofStatus(proof.id, status, user?.uid || 'admin');
    const store = await getStoreById(proof.storeId);
    if (store) {
      const nextBilling = new Date();
      nextBilling.setDate(nextBilling.getDate() + 30);
      await updateStore(store.id, {
        subscriptionStatus: status === 'approved' ? 'active' : 'pending_payment_review',
        paymentStatus: status === 'approved' ? 'approved' : 'rejected',
        paymentMethod: proof.paymentMethod,
        amountPaid: proof.amount,
        transactionId: proof.transactionId,
        nextBillingAt: nextBilling.toISOString(),
      });
      if (store.ownerId) {
        await updateDoc(doc(db, 'users', store.ownerId), {
          subscriptionStatus: status === 'approved' ? 'active' : 'pending_payment_review',
          lastPaymentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
    await load();
  }

  if (loading) return <Loader label="Loading payment proofs..." />;

  return (
    <div className="space-y-4">
      {proofs.map((proof) => (
        <div key={proof.id} className="card p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <span className="badge">Payment proof</span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{proof.storeName}</h2>
              <p className="mt-1 text-sm text-slate-500">{proof.ownerName} · {proof.ownerEmail}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Amount', `${proof.currency} ${proof.amount}`],
                  ['Method', proof.paymentMethod],
                  ['Transaction ID', proof.transactionId || '—'],
                  ['Status', proof.status],
                ].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p><p className="mt-2 font-semibold text-slate-900">{value}</p></div>)}
              </div>
              {proof.note ? <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{proof.note}</p> : null}
            </div>
            <div className="xl:w-[360px]">
              {proof.screenshotUrl ? <img src={proof.screenshotUrl} alt="Payment proof" className="h-64 w-full rounded-2xl object-cover" /> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-primary" onClick={() => review(proof, 'approved')}>Approve</button>
                <button className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700" onClick={() => review(proof, 'rejected')}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {proofs.length === 0 ? <div className="card p-8 text-slate-500">No payment proofs submitted yet.</div> : null}
    </div>
  );
}
