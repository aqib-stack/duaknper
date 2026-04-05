"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader } from "@/components/ui/Loader";
import { StoreHeader } from "@/components/storefront/StoreHeader";
import { StoreProductCard } from "@/components/storefront/StoreProductCard";
import { StoreHeroBanner } from "@/components/storefront/StoreHeroBanner";
import { StoreCategoryTabs } from "@/components/storefront/StoreCategoryTabs";
import { FloatingCartButton } from "@/components/storefront/FloatingCartButton";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { useStoreCart } from "@/contexts/StoreCartContext";
import { getPublishedProductsByStoreId } from "@/lib/services/products";
import { getStoreBySlug } from "@/lib/services/stores";
import type { Product } from "@/types/product";
import type { Store } from "@/types/store";

export default function PublicStorePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { totalItems } = useStoreCart();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadStorefront() {
      if (!slug) return;
      setLoading(true);
      setError("");

      try {
        const foundStore = await getStoreBySlug(slug);
        setStore(foundStore);

        if (!foundStore) {
          setProducts([]);
          return;
        }

        const liveProducts = await getPublishedProductsByStoreId(foundStore.id);
        setProducts(liveProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load this store.");
      } finally {
        setLoading(false);
      }
    }

    loadStorefront();
  }, [slug]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.category, product.description || ""].some((value) => value.toLowerCase().includes(term)),
    );
  }, [products, search]);

  const featuredProducts = useMemo(() => products.filter((product) => product.featured), [products]);
  const showFeaturedSection = featuredProducts.length > 0;
  const hasSingleFeaturedProduct = featuredProducts.length === 1;

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce<Record<string, Product[]>>((acc, product) => {
      const category = product.category?.trim() || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [filteredProducts]);

  const categories = Object.keys(groupedProducts);

  if (loading) return <Loader label="Loading storefront..." />;
  if (error) return <div className="container-app py-16 text-rose-600">{error}</div>;
  if (!store) {
    return (
      <div className="container-app py-16">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Store not found</h1>
          <p className="mt-3 text-slate-600">The store you are looking for does not exist or is not active yet.</p>
          <div className="mt-6"><Link href="/" className="btn-primary">Back to DukanPer</Link></div>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-[linear-gradient(180deg,#fff_0%,#fff_220px,#f8fafc_220px,#f8fafc_100%)]">
      <StoreHeader store={store} totalItems={totalItems} />

      <div className="container-app py-8 lg:py-10">
        <div className="space-y-6 lg:space-y-8">
          <StoreHeroBanner store={store} totalProducts={products.length} totalCategories={Object.keys(groupedProducts).length} />


          {showFeaturedSection ? (
            <section className="space-y-5">
              <div>
                <span className="badge">Featured products</span>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">{store.featuredSectionTitle || `Best picks from ${store.name}`}</h3>
                <p className="mt-2 text-slate-600">{store.featuredSectionSubtitle || "Highlighted products curated to boost conversions and showcase premium items."}</p>
              </div>
              <div className={hasSingleFeaturedProduct ? "max-w-sm" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"}>
                {featuredProducts.slice(0, 3).map((product) => <StoreProductCard key={product.id} product={product} />)}
              </div>
            </section>
          ) : null}

          <section id="products" className="space-y-8">
            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="badge">Products</span>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">Browse all products</h3>
                <p className="mt-2 text-slate-600">Search by product name, category, or description and explore the full catalog.</p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products or categories..."
                  className="input h-12 rounded-full pl-14 pr-4"
                />
              </div>
            </div>

            {categories.length > 0 ? <StoreCategoryTabs categories={categories} /> : null}

            {filteredProducts.length === 0 ? (
              <div className="card px-6 py-12 text-center text-slate-500">No matching products found for your search.</div>
            ) : (
              <div className="space-y-10">
                {categories.map((category) => (
                  <section key={category} id={`category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="space-y-5">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{category}</h3>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {groupedProducts[category].map((product) => <StoreProductCard key={product.id} product={product} />)}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <StoreFooter store={store} />
      <FloatingCartButton storeSlug={store.slug} />
    </main>
  );
}
