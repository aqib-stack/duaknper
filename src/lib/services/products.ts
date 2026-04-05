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
import { deleteStorageFile } from "@/lib/services/storage";
import type { Product, ProductInput, ProductVariant } from "@/types/product";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeVariants(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((group) => ({
      name: String((group as { name?: string }).name || "").trim(),
      values: Array.isArray((group as { values?: unknown[] }).values)
        ? ((group as { values?: unknown[] }).values || [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        : [],
    }))
    .filter((group) => group.name && group.values.length > 0);
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    storeId: String(data.storeId || ""),
    ownerId: String(data.ownerId || ""),
    name: String(data.name || ""),
    slug: String(data.slug || ""),
    description: String(data.description || ""),
    category: String(data.category || "Uncategorized"),
    price: Number(data.price || 0),
    compareAtPrice: data.compareAtPrice == null ? null : Number(data.compareAtPrice),
    imageUrl: String(data.imageUrl || ""),
    imagePath: String(data.imagePath || ""),
    stock: Number(data.stock || 0),
    featured: Boolean(data.featured),
    status: data.status === "draft" ? "draft" : "published",
    variants: normalizeVariants(data.variants),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
  };
}

export async function getProductsByStoreId(storeId: string) {
  const productsRef = collection(db, "products");
  const q = query(productsRef, where("storeId", "==", storeId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((snapshotDoc) => mapProduct(snapshotDoc.id, snapshotDoc.data()))
    .sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) return categoryCompare;
      return a.name.localeCompare(b.name);
    });
}

export async function createProduct(input: ProductInput) {
  const productRef = doc(collection(db, "products"));
  const nowIso = new Date().toISOString();

  const payload: Product = {
    id: productRef.id,
    storeId: input.storeId,
    ownerId: input.ownerId,
    name: input.name,
    slug: slugify(input.name),
    description: input.description || "",
    category: input.category,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    imageUrl: input.imageUrl || "",
    imagePath: input.imagePath || "",
    stock: input.stock,
    featured: Boolean(input.featured),
    status: input.status || "published",
    variants: normalizeVariants(input.variants),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await setDoc(productRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return payload;
}

export async function updateProduct(productId: string, input: ProductInput) {
  const productRef = doc(db, "products", productId);

  await updateDoc(productRef, {
    storeId: input.storeId,
    ownerId: input.ownerId,
    name: input.name,
    slug: slugify(input.name),
    description: input.description || "",
    category: input.category,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    imageUrl: input.imageUrl || "",
    imagePath: input.imagePath || "",
    stock: input.stock,
    featured: Boolean(input.featured),
    status: input.status || "published",
    variants: normalizeVariants(input.variants),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(productId: string, imagePath?: string | null) {
  await deleteDoc(doc(db, "products", productId));
  await deleteStorageFile(imagePath);
}

export async function getPublishedProductsByStoreId(storeId: string) {
  const products = await getProductsByStoreId(storeId);
  return products.filter((product) => product.status === "published");
}
