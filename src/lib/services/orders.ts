import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CreateOrderInput, Order, OrderPaymentMethod, OrderSource, OrderStatus } from "@/types/order";

function toIso(value: unknown) {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeStatus(raw: unknown): OrderStatus {
  const value = String(raw || "pending");
  return ["pending", "confirmed", "processing", "delivered", "cancelled", "completed"].includes(value)
    ? (value as OrderStatus)
    : "pending";
}

function normalizeSource(raw: unknown): OrderSource {
  return raw === "offline" ? "offline" : "online";
}

function normalizePayment(raw: unknown): OrderPaymentMethod {
  return raw === "cash" ? "cash" : "cod";
}

function makeReceiptNumber(orderId: string) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `RCP-${stamp}-${orderId.slice(0, 6).toUpperCase()}`;
}

function mapOrder(id: string, data: Record<string, unknown>): Order {
  const receiptNumber = String(data.receiptNumber || makeReceiptNumber(id));
  return {
    id,
    storeId: String(data.storeId || ""),
    storeSlug: String(data.storeSlug || ""),
    customerName: String(data.customerName || ""),
    customerEmail: String(data.customerEmail || ""),
    customerId: String(data.customerId || ""),
    phone: String(data.phone || ""),
    city: String(data.city || ""),
    address: String(data.address || ""),
    notes: String(data.notes || ""),
    items: Array.isArray(data.items)
      ? data.items.map((item) => ({
          productId: String((item as { productId?: string }).productId || ""),
          name: String((item as { name?: string }).name || ""),
          price: Number((item as { price?: number }).price || 0),
          quantity: Number((item as { quantity?: number }).quantity || 0),
          imageUrl: String((item as { imageUrl?: string }).imageUrl || ""),
          selectedVariants: Array.isArray((item as { selectedVariants?: unknown[] }).selectedVariants)
            ? ((item as { selectedVariants?: unknown[] }).selectedVariants || []).map((variant) => ({
                name: String((variant as { name?: string }).name || ""),
                value: String((variant as { value?: string }).value || ""),
              }))
            : [],
        }))
      : [],
    subtotal: Number(data.subtotal || 0),
    deliveryFee: Number(data.deliveryFee || 0),
    discountAmount: Number(data.discountAmount || 0),
    couponCode: String(data.couponCode || ""),
    total: Number(data.total || 0),
    paymentMethod: normalizePayment(data.paymentMethod),
    source: normalizeSource(data.source),
    status: normalizeStatus(data.status),
    receiptNumber,
    cashReceived: Number(data.cashReceived || 0),
    changeAmount: Number(data.changeAmount || 0),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function createOrder(input: CreateOrderInput) {
  const orderRef = doc(collection(db, "orders"));
  const nowIso = new Date().toISOString();
  const receiptNumber = input.receiptNumber || makeReceiptNumber(orderRef.id);

  const payload: Order = {
    id: orderRef.id,
    ...input,
    paymentMethod: input.paymentMethod,
    source: input.source || "online",
    status: input.status || "pending",
    receiptNumber,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await setDoc(orderRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return payload;
}

export async function createOfflineOrder(input: Omit<CreateOrderInput, "paymentMethod" | "source" | "status"> & { cashReceived?: number; changeAmount?: number; }) {
  return createOrder({
    ...input,
    paymentMethod: "cash",
    source: "offline",
    status: "completed",
  });
}

export async function getOrdersByStoreId(storeId: string) {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("storeId", "==", storeId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((snapshotDoc) => mapOrder(snapshotDoc.id, snapshotDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrdersByCustomerId(customerId: string) {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("customerId", "==", customerId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapOrder(d.id, d.data())).sort((a,b)=> new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
}

export async function getOrderById(orderId: string) {
  const orderRef = doc(db, "orders", orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) return null;
  return mapOrder(snap.id, snap.data());
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}
