import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Coupon, CouponInput } from "@/types/coupon";

function toIso(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function mapCoupon(id: string, data: Record<string, unknown>): Coupon {
  return {
    id,
    storeId: String(data.storeId || ""),
    code: String(data.code || "").toUpperCase(),
    type: data.type === "fixed" ? "fixed" : "percentage",
    value: Number(data.value || 0),
    minimumOrder: Number(data.minimumOrder || 0),
    isActive: data.isActive === false ? false : true,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getCouponsByStoreId(storeId: string) {
  const ref = collection(db, "coupons");
  const q = query(ref, where("storeId", "==", storeId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCoupon(d.id, d.data())).sort((a, b) => a.code.localeCompare(b.code));
}

export async function createCoupon(input: CouponInput) {
  const couponRef = doc(collection(db, "coupons"));
  const payload: Coupon = {
    id: couponRef.id,
    storeId: input.storeId,
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: input.value,
    minimumOrder: input.minimumOrder || 0,
    isActive: input.isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(couponRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return payload;
}

export async function updateCoupon(couponId: string, input: Partial<CouponInput>) {
  await updateDoc(doc(db, "coupons", couponId), {
    ...(input.code ? { code: input.code.trim().toUpperCase() } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(typeof input.value === "number" ? { value: input.value } : {}),
    ...(typeof input.minimumOrder === "number" ? { minimumOrder: input.minimumOrder } : {}),
    ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCoupon(couponId: string) {
  await deleteDoc(doc(db, "coupons", couponId));
}

export async function findActiveCoupon(storeId: string, code: string) {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return null;
  const coupons = await getCouponsByStoreId(storeId);
  return coupons.find((coupon) => coupon.code === normalizedCode && coupon.isActive) || null;
}

export function calculateCouponDiscount(subtotal: number, coupon?: Coupon | null) {
  if (!coupon || !coupon.isActive) return 0;
  if ((coupon.minimumOrder || 0) > subtotal) return 0;

  if (coupon.type === "fixed") {
    return Math.min(subtotal, coupon.value);
  }

  return Math.min(subtotal, Math.round((subtotal * coupon.value) / 100));
}
