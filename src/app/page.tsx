"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Flame,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
  Tag,
  TrendingUp,
} from "lucide-react";
import { getMarketplaceStores, type MarketplaceStore } from "@/lib/services/stores";
import { normalizeStoreCategory, DEFAULT_STORE_CATEGORY } from "@/lib/constants/storeCategories";

const sellerFeatures = [
  "Premium storefronts for every seller",
  "COD-ready checkout experience",
  "WhatsApp-first local shopping flow",
  "Seller dashboard with analytics",
];

const marketplaceFooterLinks = [
  { label: "Browse stores", href: "#browse-stores" },
  { label: "Featured stores", href: "#featured-stores" },
  { label: "Seller Login", href: "/login" },
  { label: "Create Store", href: "/signup" },
];

const sellerFooterHighlights = [
  "Premium storefronts",
  "COD-ready checkout",
  "Analytics dashboard",
  "WhatsApp-first ordering",
];

function inferCategory(store: MarketplaceStore) {
  return normalizeStoreCategory(store.category || DEFAULT_STORE_CATEGORY);
}

function formatDateLabel(value?: string) {
  if (!value) return "Recently joined";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently joined";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StoreInitial({ name }: { name: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 text-xl font-bold text-white shadow-soft">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StoreCard({
  store,
  compact = false,
  featured = false,
}: {
  store: MarketplaceStore;
  compact?: boolean;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/store/${store.slug}`}
      className={`group card flex h-full flex-col transition duration-200 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-[0_24px_60px_rgba(236,72,153,0.10)] ${
        featured ? "overflow-hidden p-0" : "p-6"
      }`}
    >
      {featured ? (
        <>
          <div className="bg-gradient-to-br from-slate-950 via-[#0d1d4a] to-[#713f32] p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <StoreInitial name={store.name} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-semibold text-white">{store.name}</h3>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                      Featured storefront
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-200">/{store.slug}</p>
                </div>
              </div>
              <div className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80 lg:block">
                {inferCategory(store)}
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200">
              {store.description || "A premium DukanPer storefront ready to accept orders and showcase products online."}
            </p>
          </div>

          <div className="grid gap-4 p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <p className="mt-2 font-medium text-slate-800">{store.city || "Pakistan"}{store.country ? `, ${store.country}` : ""}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Package className="h-4 w-4" />
                  Products
                </div>
                <p className="mt-2 font-medium text-slate-800">{store.productCount} listed</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarClock className="h-4 w-4" />
                  Joined
                </div>
                <p className="mt-2 font-medium text-slate-800">{formatDateLabel(store.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5">
              <div>
                <div className="text-sm text-slate-500">Seller support</div>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {store.phone ? store.phone : "Ready for local orders, COD, and WhatsApp-first shopping."}
                </p>
              </div>
              <span className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition group-hover:bg-pink-600">
                Visit store
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <StoreInitial name={store.name} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-slate-900">{store.name}</h3>
                  {store.productCount > 0 ? <span className="badge">Live store</span> : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">/{store.slug}</p>
              </div>
            </div>
          </div>

          <p className={`mt-5 text-sm leading-6 text-slate-600 ${compact ? "line-clamp-2 min-h-[3rem]" : "line-clamp-3 min-h-[4.5rem]"}`}>
            {store.description || "A premium DukanPer storefront ready to accept orders and showcase products online."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </div>
              <p className="mt-2 font-medium text-slate-800">{store.city || "Pakistan"}{store.country ? `, ${store.country}` : ""}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Package className="h-4 w-4" />
                <span>Products</span>
              </div>
              <p className="mt-2 font-medium text-slate-800">{store.productCount} listed</p>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="text-sm text-slate-500">
              {store.phone ? `Support: ${store.phone}` : "Ready for local orders"}
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-pink-600">
              Visit store
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </>
      )}
    </Link>
  );
}

export default function HomePage() {
  const [stores, setStores] = useState<MarketplaceStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMarketplace() {
      try {
        const nextStores = await getMarketplaceStores();
        if (mounted) setStores(nextStores);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMarketplace();
    return () => {
      mounted = false;
    };
  }, []);

  const featuredStores = useMemo(() => stores.slice(0, 3), [stores]);

  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stores;

    return stores.filter((store) => {
      const haystack = [store.name, store.slug, store.description || "", store.city || "", store.country || "", inferCategory(store)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [search, stores]);

  const totalProducts = useMemo(() => stores.reduce((sum, store) => sum + store.productCount, 0), [stores]);

  const totalCities = useMemo(() => {
    const cities = new Set(stores.map((store) => `${store.city || ""}-${store.country || ""}`).filter(Boolean));
    return cities.size;
  }, [stores]);

  const categories = useMemo(() => {
    const counts = stores.reduce<Record<string, number>>((acc, store) => {
      const category = inferCategory(store);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));
  }, [stores]);

  const trendingStores = useMemo(
    () => [...stores].sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name)).slice(0, 4),
    [stores],
  );

  const recentStores = useMemo(
    () =>
      [...stores]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 4),
    [stores],
  );

  return (
    <main className="pb-16">
      <section className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-6 py-5 lg:px-10 xl:px-12">
          <Link href="/" className="flex items-center gap-2">
  <Image
    src="/logo.png"
    alt="DukanPer"
    width={140}
    height={40}
    priority
    className="w-auto"
  />
</Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary">Seller Login</Link>
            <Link href="/signup" className="btn-primary">Create Store</Link>
          </div>
        </div>
      </section>

      <section className="w-full px-6 pt-10 lg:px-10 lg:pt-14 xl:px-12">
        <div className="mx-auto grid w-full max-w-[1800px] gap-8 lg:grid-cols-[1.45fr_0.9fr] lg:items-stretch">
          <div className="card overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-[#0d1d4a] to-[#713f32] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <Sparkles className="h-4 w-4" /> Marketplace powered by DukanPer
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-balance sm:text-5xl xl:text-6xl">
              Discover premium local stores in one powerful DukanPer marketplace.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200 xl:text-xl">
              Browse active stores, explore trusted sellers, and jump directly into each storefront using its unique /store/[slug] page.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#browse-stores" className="btn-primary">Browse stores</a>
              <Link href="/signup" className="btn-secondary border-white/20 bg-white/10 text-white">Become a seller</Link>
            </div>
          </div>

          <div className="card p-6 lg:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Active stores</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">{stores.length}</h3>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Published products</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">{totalProducts}</h3>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Cities covered</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">{totalCities}</h3>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Seller tools</p>
                <h3 className="mt-2 text-3xl font-bold text-slate-900">24/7</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {sellerFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-pink-500" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="w-full px-6 pt-8 lg:px-10 xl:px-12">
          <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-soft">
            <div className="mr-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Tag className="h-4 w-4 text-pink-500" /> Popular categories
            </div>
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => setSearch(category.label)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"
              >
                {category.label} <span className="text-slate-400">({category.count})</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section id="featured-stores" className="w-full px-6 pt-10 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1800px] rounded-[32px] bg-gradient-to-b from-white to-[#fff8fb] p-6 shadow-soft ring-1 ring-slate-200 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="badge">Featured stores</span>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 lg:text-4xl">Top stores on DukanPer</h2>
              <p className="mt-3 text-slate-600">
                Explore the strongest storefronts first, then continue into the full marketplace directory below.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-soft">
              <ShoppingBag className="h-4 w-4 text-pink-500" />
              {featuredStores.length} featured store{featuredStores.length === 1 ? "" : "s"}
            </div>
          </div>

          {featuredStores.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">
              No stores available yet. Create the first DukanPer store to populate the marketplace.
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap gap-6">
              {featuredStores.map((store) => (
                <div key={store.id} className="min-w-[320px] flex-1 basis-[360px]">
                  <StoreCard store={store} featured />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="w-full px-6 pt-10 lg:px-10 xl:px-12">
        <div className="mx-auto grid w-full max-w-[1800px] gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="card p-6 lg:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <span className="badge">Trending stores</span>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">Popular right now</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              {trendingStores.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Trending stores will appear here as sellers add more products.</div>
              ) : (
                trendingStores.map((store, index) => (
                  <Link key={store.id} href={`/store/${store.slug}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-pink-200 hover:bg-pink-50/40">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">#{index + 1}</div>
                      <div>
                        <div className="font-medium text-slate-900">{store.name}</div>
                        <div className="text-sm text-slate-500">{store.productCount} products · {inferCategory(store)}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="card p-6 lg:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <span className="badge">Recently added</span>
                <h3 className="mt-3 text-2xl font-bold text-slate-900">Newest stores on DukanPer</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {recentStores.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">New sellers will appear here as soon as they create a storefront.</div>
              ) : (
                recentStores.map((store) => (
                  <Link key={store.id} href={`/store/${store.slug}`} className="rounded-2xl border border-slate-200 p-5 transition hover:border-pink-200 hover:bg-pink-50/40">
                    <div className="flex items-center gap-3">
                      <StoreInitial name={store.name} />
                      <div>
                        <div className="font-medium text-slate-900">{store.name}</div>
                        <div className="text-sm text-slate-500">Joined {formatDateLabel(store.createdAt)}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-slate-600">{store.city || "Pakistan"}{store.country ? `, ${store.country}` : ""}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="browse-stores" className="w-full px-6 pt-10 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1800px] rounded-[32px] bg-white p-6 shadow-soft ring-1 ring-slate-200 lg:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <span className="badge">All stores</span>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 lg:text-4xl">Browse the DukanPer marketplace</h2>
              <p className="mt-3 text-slate-600">
                Search by store name, slug, category, city, or country. Every result links directly to a seller storefront.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:max-w-2xl">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-100">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search stores, categories, cities, countries, or slugs..."
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">Instant marketplace search across all active DukanPer stores.</p>
                <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                  <StoreIcon className="h-4 w-4 text-pink-500" />
                  {filteredStores.length} store{filteredStores.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="card mt-8 flex min-h-[280px] items-center justify-center border-dashed bg-slate-50">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading marketplace...
              </div>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="card mt-8 p-10 text-center">
              <h3 className="text-2xl font-semibold text-slate-900">No stores found</h3>
              <p className="mt-3 text-slate-600">
                Try a different search term or create a new store from the seller signup flow.
              </p>
              <div className="mt-6">
                <Link href="/signup" className="btn-primary">Create your store</Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="w-full px-6 pt-10 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1800px] overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-[#0d1d4a] to-[#713f32] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
                <TrendingUp className="h-4 w-4" /> Start selling on DukanPer
              </span>
              <h2 className="mt-5 text-3xl font-bold lg:text-5xl">Launch your online store in minutes and reach more customers.</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
                Create a premium storefront, manage products, accept COD orders, and track performance from a single seller dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="btn-primary">Create Store</Link>
                <Link href="/login" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/15">Seller Login</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-slate-200">Storefronts</p>
                <h3 className="mt-2 text-3xl font-bold">{stores.length}+</h3>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-slate-200">Published products</p>
                <h3 className="mt-2 text-3xl font-bold">{totalProducts}+</h3>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-slate-200">Marketplace reach</p>
                <h3 className="mt-2 text-3xl font-bold">{totalCities || 1} cities</h3>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-slate-200">Seller support</p>
                <h3 className="mt-2 text-3xl font-bold">24/7</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-slate-200 bg-white/90">
        <div className="mx-auto grid w-full max-w-[1800px] gap-8 px-6 py-10 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1fr] lg:px-10 xl:px-12">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 text-lg font-bold text-white shadow-soft">
                D
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">DukanPer Marketplace</h3>
                <p className="text-sm text-slate-500">Multi-store commerce powered by DukanPer</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              Discover trusted local stores, browse premium storefronts, and give every seller a modern online shop with dashboards, coupons, analytics, and fast checkout.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {sellerFooterHighlights.map((highlight) => (
                <span key={highlight} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Marketplace</h4>
            <div className="mt-4 space-y-3">
              {marketplaceFooterLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-sm font-medium text-slate-700 transition hover:text-pink-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Store stats</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Active stores</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{stores.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-slate-500">Published products</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{totalProducts}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Support</h4>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <Phone className="mt-0.5 h-4 w-4 text-pink-500" />
                <span>Seller support available from each store profile</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <Mail className="mt-0.5 h-4 w-4 text-pink-500" />
                <span>Premium marketplace onboarding for new sellers</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <MapPin className="mt-0.5 h-4 w-4 text-pink-500" />
                <span>Built for local commerce across Pakistan and beyond</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200">
          <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-6 py-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-10 xl:px-12">
            <p>© 2026 DukanPer. Premium marketplace experience for modern sellers.</p>
            <p>Explore stores, create your own storefront, and grow with DukanPer.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
