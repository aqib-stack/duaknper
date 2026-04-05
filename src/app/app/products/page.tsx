"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Pencil, Plus, Trash2, Package, Star } from "lucide-react";
import { ProductForm } from "@/components/forms/ProductForm";
import { Loader } from "@/components/ui/Loader";
import { useAuth } from "@/contexts/AuthContext";
import { deleteProduct, createProduct, getProductsByStoreId, updateProduct } from "@/lib/services/products";
import { getStoreByOwnerId } from "@/lib/services/stores";
import type { Product, ProductInput } from "@/types/product";
import type { Store } from "@/types/store";

const fallbackImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80";

function stockProgress(stock: number) {
  if (stock <= 0) return 0;
  return Math.min(100, Math.max(10, stock));
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData(currentUserId: string) {
    setLoading(true);
    setError("");

    try {
      const foundStore = await getStoreByOwnerId(currentUserId);
      setStore(foundStore);

      if (!foundStore) {
        setProducts([]);
        return;
      }

      const storeProducts = await getProductsByStoreId(foundStore.id);
      setProducts(storeProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadData(user.uid);
  }, [user]);

  const stats = useMemo(() => ({
    total: products.length,
    published: products.filter((product) => product.status === "published").length,
    featured: products.filter((product) => product.featured).length,
    lowStock: products.filter((product) => product.stock > 0 && product.stock <= 5).length,
  }), [products]);

  const lowStockProducts = useMemo(() => products.filter((product) => product.stock > 0 && product.stock <= 5), [products]);

  async function handleCreate(values: ProductInput) {
    if (!user || !store) return;
    setSaving(true);
    try {
      await createProduct(values);
      await loadData(user.uid);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(values: ProductInput) {
    if (!user || !editingProduct) return;
    setSaving(true);
    try {
      await updateProduct(editingProduct.id, values);
      setEditingProduct(null);
      await loadData(user.uid);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(`Delete ${product.name}? This action cannot be undone.`);
    if (!confirmed || !user) return;

    try {
      await deleteProduct(product.id, product.imagePath);
      if (editingProduct?.id === product.id) {
        setEditingProduct(null);
      }
      await loadData(user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product.");
    }
  }

  if (loading) return <Loader label="Loading your products..." />;

  if (!store) {
    return (
      <div className="card p-8">
        <span className="badge">Step 2 of 2</span>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">Create your store before adding products</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Your product catalog is linked to a store. Finish the store setup first, then come back here to add products.</p>
        <div className="mt-6"><Link href="/app/create-store" className="btn-primary">Create Store</Link></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Products", String(stats.total)],
          ["Published", String(stats.published)],
          ["Featured", String(stats.featured)],
          ["Low Stock", String(stats.lowStock)],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      {lowStockProducts.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-semibold">Low stock alerts</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {lowStockProducts.map((product) => (
              <span key={product.id} className="rounded-full bg-white px-3 py-2 text-sm font-medium text-amber-800 shadow-sm">
                {product.name} • {product.stock} left
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <ProductForm
          initialData={editingProduct}
          onSubmit={editingProduct ? handleUpdate : handleCreate}
          onCancelEdit={() => setEditingProduct(null)}
          storeId={store.id}
          ownerId={user?.uid || ""}
        />

        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="badge">Catalog</span>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Your products</h2>
              <p className="mt-2 text-sm text-slate-500">Manage your catalog for <span className="font-medium text-slate-700">{store.name}</span>.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Store slug: <span className="font-semibold text-slate-800">/{store.slug}</span></div>
          </div>

          {products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-700"><Plus className="h-6 w-6" /></div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No products yet</h3>
              <p className="mt-2 text-sm text-slate-500">Add your first product using the form on the left.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {products.map((product) => {
                const discount = product.compareAtPrice && product.compareAtPrice > product.price
                  ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                  : null;
                const progress = stockProgress(product.stock);

                return (
                  <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="aspect-[16/10] bg-slate-100">
                      <img src={product.imageUrl || fallbackImage} alt={product.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge">{product.category}</span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${product.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{product.status}</span>
                        {product.featured ? <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700"><Star className="h-3.5 w-3.5" /> Featured</span> : null}
                        {product.stock <= 5 ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> Low stock</span> : null}
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">{product.description || "No description added yet."}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
                          <p className="text-lg font-bold text-slate-900">Rs {product.price.toLocaleString()}</p>
                          {product.compareAtPrice ? <p className="text-xs text-slate-400 line-through">Rs {product.compareAtPrice.toLocaleString()}</p> : null}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" /> Stock: <span className="font-medium text-slate-700">{product.stock}</span>
                        </div>
                        {discount ? <span className="rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-700">{discount}% off</span> : null}
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span>Stock progress</span>
                          <span>{product.stock} units</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div className={`h-full rounded-full ${product.stock <= 5 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <button type="button" onClick={() => setEditingProduct(product)} className="btn-secondary flex-1" disabled={saving}><Pencil className="mr-2 h-4 w-4" /> Edit</button>
                        <button type="button" onClick={() => handleDelete(product)} className="inline-flex flex-1 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 font-medium text-rose-700 transition hover:bg-rose-100" disabled={saving}><Trash2 className="mr-2 h-4 w-4" /> Delete</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
