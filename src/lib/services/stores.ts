import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CreateStoreInput, Store, UpdateStoreInput } from "@/types/store";
import { DEFAULT_STORE_CATEGORY, normalizeStoreCategory } from "@/lib/constants/storeCategories";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toIsoDate(value: unknown, fallback?: string) {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "toDate" in (value as Record<string, unknown>)) {
    try {
      return ((value as { toDate: () => Date }).toDate()).toISOString();
    } catch {}
  }
  return fallback || new Date().toISOString();
}

function hydrateStore(id: string, data: Record<string, unknown>) {
  return {
    id,
    ownerId: String(data.ownerId || ""),
    name: String(data.name || ""),
    slug: String(data.slug || ""),
    description: String(data.description || ""),
    phone: String(data.phone || ""),
    whatsapp: String(data.whatsapp || ""),
    city: String(data.city || ""),
    category: normalizeStoreCategory(String(data.category || "")),
    currency: "PKR" as const,
    status: data.status === "suspended" ? "suspended" : "active",
    theme: String(data.theme || "default"),
    supportEmail: String(data.supportEmail || ""),
    country: String(data.country || "Pakistan"),
    address: String(data.address || ""),
    deliveryCharge: Number(data.deliveryCharge || 0),
    freeDeliveryThreshold: Number(data.freeDeliveryThreshold || 0),
    minimumOrderAmount: Number(data.minimumOrderAmount || 0),
    enableCoupons: data.enableCoupons === false ? false : true,
    enableOrderTracking: data.enableOrderTracking === false ? false : true,
    announcementText: String(data.announcementText || ""),
    deliveryEstimate: String(data.deliveryEstimate || "Same day or next day delivery"),
    heroTitle: String(data.heroTitle || ""),
    heroSubtitle: String(data.heroSubtitle || ""),
    featuredSectionTitle: String(data.featuredSectionTitle || "Featured products"),
    featuredSectionSubtitle: String(data.featuredSectionSubtitle || "Highlighted products curated to boost conversions and showcase premium items."),
    subscriptionStatus: (data.subscriptionStatus as Store["subscriptionStatus"]) || "trial",
    subscriptionPlan: String(data.subscriptionPlan || "Starter Plan"),
    trialEndsAt: toIsoDate(data.trialEndsAt),
    nextBillingAt: toIsoDate(data.nextBillingAt, ""),
    paymentStatus: (data.paymentStatus as Store["paymentStatus"]) || "none",
    paymentMethod: String(data.paymentMethod || ""),
    amountPaid: Number(data.amountPaid || 0),
    transactionId: String(data.transactionId || ""),
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  } satisfies Store;
}

export type MarketplaceStore = Store & { productCount: number };

export async function checkStoreSlugAvailable(slug: string) {
  const cleaned = slugify(slug);
  const storesRef = collection(db, "stores");
  const q = query(storesRef, where("slug", "==", cleaned), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty ? null : cleaned;
}

export async function createStore(input: CreateStoreInput) {
  const cleanedSlug = await checkStoreSlugAvailable(input.slug || input.name);
  if (!cleanedSlug) throw new Error("This store slug is already taken.");

  const storeRef = doc(collection(db, "stores"));
  const userRef = doc(db, "users", input.ownerId);

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 30);

  const storeData: Store = {
    id: storeRef.id,
    ownerId: input.ownerId,
    name: input.name,
    slug: cleanedSlug,
    description: input.description || "",
    phone: input.phone,
    whatsapp: input.whatsapp,
    city: input.city,
    category: input.category || DEFAULT_STORE_CATEGORY,
    currency: "PKR",
    status: "active",
    theme: "default",
    supportEmail: "",
    country: "Pakistan",
    address: "",
    deliveryCharge: 0,
    freeDeliveryThreshold: 0,
    minimumOrderAmount: 0,
    enableCoupons: true,
    enableOrderTracking: true,
    announcementText: "",
    deliveryEstimate: "Same day or next day delivery",
    heroTitle: `${input.name} — shop online with ease`,
    heroSubtitle: "Discover featured products, secure checkout, and delivery across Pakistan.",
    featuredSectionTitle: "Featured products",
    featuredSectionSubtitle: "Highlighted products curated to boost conversions and showcase premium items.",
    subscriptionStatus: "trial",
    subscriptionPlan: "Starter Plan",
    trialEndsAt: trialEnd.toISOString(),
    nextBillingAt: trialEnd.toISOString(),
    paymentStatus: "none",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await setDoc(storeRef, {
    ...storeData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(userRef, {
    hasStore: true,
    storeId: storeRef.id,
    trialEndsAt: trialEnd.toISOString(),
    subscriptionPlan: "Starter Plan",
    subscriptionStatus: "trial",
    updatedAt: serverTimestamp(),
  });

  return storeData;
}

export async function getStoreByOwnerId(ownerId: string) {
  const userRef = doc(db, "users", ownerId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() as { storeId?: string } | undefined;
  if (!userData?.storeId) return null;
  const storeRef = doc(db, "stores", userData.storeId);
  const storeSnap = await getDoc(storeRef);
  if (!storeSnap.exists()) return null;
  return hydrateStore(storeSnap.id, storeSnap.data());
}

export async function getStoreById(storeId: string) {
  const storeRef = doc(db, "stores", storeId);
  const storeSnap = await getDoc(storeRef);
  if (!storeSnap.exists()) return null;
  return hydrateStore(storeSnap.id, storeSnap.data());
}

export async function getStoreBySlug(slug: string) {
  const cleaned = slugify(slug);
  const storesRef = collection(db, "stores");
  const q = query(storesRef, where("slug", "==", cleaned), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const storeDoc = snapshot.docs[0];
  return hydrateStore(storeDoc.id, storeDoc.data());
}

export async function getMarketplaceStores() {
  const storesRef = collection(db, "stores");
  const productsRef = collection(db, "products");
  const [storeSnapshot, productSnapshot] = await Promise.all([getDocs(storesRef), getDocs(productsRef)]);

  const publishedProductCounts = productSnapshot.docs.reduce<Record<string, number>>((acc, productDoc) => {
    const data = productDoc.data();
    const storeId = String(data.storeId || "");
    const status = data.status === "draft" ? "draft" : "published";
    if (!storeId || status !== "published") return acc;
    acc[storeId] = (acc[storeId] || 0) + 1;
    return acc;
  }, {});

  return storeSnapshot.docs
    .map((storeDoc) => ({ ...hydrateStore(storeDoc.id, storeDoc.data()), productCount: publishedProductCounts[storeDoc.id] || 0 } satisfies MarketplaceStore))
    .filter((store) => store.status === "active" && store.subscriptionStatus !== "expired" && store.subscriptionStatus !== "suspended")
    .sort((a, b) => {
      if (b.productCount !== a.productCount) return b.productCount - a.productCount;
      return a.name.localeCompare(b.name);
    });
}

export async function getAllStoresForAdmin() {
  const storesRef = collection(db, "stores");
  const usersRef = collection(db, "users");
  const [storeSnapshot, userSnapshot] = await Promise.all([getDocs(storesRef), getDocs(usersRef)]);
  const usersById = userSnapshot.docs.reduce<Record<string, Record<string, unknown>>>((acc, d) => {
    acc[d.id] = d.data();
    return acc;
  }, {});
  return storeSnapshot.docs.map((storeDoc) => {
    const store = hydrateStore(storeDoc.id, storeDoc.data());
    const owner = usersById[store.ownerId] || {};
    return {
      ...store,
      ownerName: String(owner.name || "Seller"),
      ownerEmail: String(owner.email || ""),
    };
  });
}

export async function updateStore(storeId: string, input: UpdateStoreInput) {
  const storeRef = doc(db, "stores", storeId);
  await updateDoc(storeRef, { ...input, updatedAt: serverTimestamp() });
}
