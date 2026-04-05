import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { PaymentMethod, PaymentProof, PaymentProofStatus } from '@/types/subscription';

function toIsoDate(value: unknown) {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try { return ((value as { toDate: () => Date }).toDate()).toISOString(); } catch {}
  }
  return new Date().toISOString();
}

function hydrate(id: string, data: Record<string, unknown>): PaymentProof {
  return {
    id,
    storeId: String(data.storeId || ''),
    ownerId: String(data.ownerId || ''),
    storeName: String(data.storeName || ''),
    ownerName: String(data.ownerName || ''),
    ownerEmail: String(data.ownerEmail || ''),
    amount: Number(data.amount || 0),
    currency: data.currency === 'USD' ? 'USD' : 'PKR',
    paymentMethod: (data.paymentMethod as PaymentMethod) || 'Bank Transfer',
    transactionId: String(data.transactionId || ''),
    screenshotUrl: String(data.screenshotUrl || ''),
    screenshotPath: String(data.screenshotPath || ''),
    note: String(data.note || ''),
    status: (data.status as PaymentProofStatus) || 'pending',
    submittedAt: toIsoDate(data.submittedAt),
    reviewedAt: data.reviewedAt ? toIsoDate(data.reviewedAt) : '',
    reviewedBy: String(data.reviewedBy || ''),
  };
}

export async function createPaymentProof(input: Omit<PaymentProof, 'id' | 'submittedAt' | 'status'> & { status?: PaymentProofStatus }) {
  const ref = doc(collection(db, 'paymentProofs'));
  await setDoc(ref, {
    ...input,
    status: input.status || 'pending',
    submittedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPaymentProofsByStore(storeId: string) {
  const q = query(collection(db, 'paymentProofs'), where('storeId', '==', storeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => hydrate(d.id, d.data())).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));
}

export async function getAllPaymentProofs() {
  const snapshot = await getDocs(collection(db, 'paymentProofs'));
  return snapshot.docs.map((d) => hydrate(d.id, d.data())).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));
}

export async function updatePaymentProofStatus(proofId: string, status: PaymentProofStatus, reviewedBy: string) {
  await updateDoc(doc(db, 'paymentProofs', proofId), {
    status,
    reviewedBy,
    reviewedAt: serverTimestamp(),
  });
}
