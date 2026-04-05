"use client";

import { Eye, Heart, Plus, Sparkles, X } from "lucide-react";
import type { Product } from "@/types/product";
import { getDefaultVariantSelections, useStoreCart } from "@/contexts/StoreCartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useEffect, useMemo, useState } from "react";
import { resolveVariantPricing } from "@/lib/variantPricing";

const fallbackImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80";

export function StoreProductCard({ product }: { product: Product }) {
  const { addItem } = useStoreCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const outOfStock = product.stock <= 0;
  const defaultSelections = useMemo(() => getDefaultVariantSelections(product.variants), [product.variants]);
  const [selections, setSelections] = useState(defaultSelections);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewQuantity, setQuickViewQuantity] = useState(1);
  const wishlisted = isWishlisted(product.id);

  useEffect(() => {
    setSelections(defaultSelections);
    setQuickViewQuantity(1);
  }, [defaultSelections]);

  const pricing = useMemo(() => resolveVariantPricing(product, selections), [product, selections]);
  const hasDiscount = Boolean(pricing.compareAtPrice && pricing.compareAtPrice > pricing.price);
  const discountPercent = hasDiscount
    ? Math.round((((pricing.compareAtPrice as number) - pricing.price) / (pricing.compareAtPrice as number)) * 100)
    : 0;

  function updateSelection(groupName: string, value: string) {
    setSelections((prev) => {
      const exists = prev.some((item) => item.name === groupName);
      if (exists) {
        return prev.map((item) => (item.name === groupName ? { ...item, value } : item));
      }
      return [...prev, { name: groupName, value }];
    });
  }

  function renderVariantSelectors(mode: "card" | "quickview" = "quickview") {
    if (!product.variants?.length) {
      return mode === "card" ? <div className="mt-4 min-h-[94px]" /> : null;
    }

    return (
      <div className={`mt-4 ${mode === "card" ? "min-h-[94px]" : "space-y-3"}`}>
        {mode === "card" ? <div className="min-h-[94px]" /> : null}
        {mode === "quickview"
          ? product.variants.map((group) => {
              const currentValue = selections.find((item) => item.name === group.name)?.value || group.values[0];
              return (
                <div key={group.name}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateSelection(group.name, value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${currentValue === value ? "border-pink-500 bg-pink-50 text-pink-700" : "border-slate-200 text-slate-600"}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          : null}
      </div>
    );
  }

  return (
    <>
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/60">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl || fallbackImage}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="badge border border-white/70 bg-white/90 text-pink-700">
            {product.category}
          </span>

          {product.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-white">
              <Sparkles className="h-3.5 w-3.5" /> Featured
            </span>
          ) : null}

          {hasDiscount ? (
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm backdrop-blur ${
              wishlisted
                ? "border-pink-500 bg-pink-500 text-white"
                : "border-white/80 bg-white/95 text-slate-700"
            }`}
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/80 bg-white/95 px-4 text-sm font-medium text-slate-700 shadow-sm backdrop-blur"
          >
            <Eye className="mr-2 h-4 w-4" /> Quick view
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>

          <div className="mt-2">
            <p className="mt-2 flex items-baseline gap-1">
  <span className="text-sm font-medium text-slate-500">Rs</span>
  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
    {pricing.price.toLocaleString()}
  </span>
</p>

            {hasDiscount ? (
              <p className="mt-1 text-sm text-slate-400 line-through">
                Rs {(pricing.compareAtPrice as number).toLocaleString()}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            className="btn-primary flex w-full items-center justify-center gap-2"
            onClick={() => setQuickViewOpen(true)}
            disabled={outOfStock}
          >
            <Plus className="h-4 w-4" />
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>

      {quickViewOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setQuickViewOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="badge">Quick view</span>
                <h3 className="mt-3 text-3xl font-bold text-slate-900">{product.name}</h3>
              </div>
              <button type="button" onClick={() => setQuickViewOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]">
              <div className="overflow-hidden rounded-[1.75rem] bg-slate-100 lg:max-h-[520px]">
                <img src={product.imageUrl || fallbackImage} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">{product.category}</span>
                  {product.featured ? <span className="badge">Featured</span> : null}
                </div>
                {product.description ? <p className="text-lg leading-8 text-slate-600">{product.description}</p> : null}
                <div>
                  <p className="text-3xl font-bold text-slate-900">Rs {pricing.price.toLocaleString()}</p>
                  {hasDiscount ? <p className="mt-1 text-sm text-slate-400 line-through">Rs {(pricing.compareAtPrice as number).toLocaleString()}</p> : null}
                </div>
                {renderVariantSelectors("quickview")}
                {selections.length > 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Selected: {selections.map((item) => `${item.name}: ${item.value}`).join(" • ")}
                  </div>
                ) : null}
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</p>
                      <p className="mt-1 text-sm text-slate-500">Choose how many units to add.</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <button type="button" className="text-lg font-semibold text-slate-700 disabled:opacity-40" onClick={() => setQuickViewQuantity((qty) => Math.max(1, qty - 1))} disabled={quickViewQuantity <= 1}>−</button>
                      <span className="min-w-6 text-center text-sm font-semibold text-slate-900">{quickViewQuantity}</span>
                      <button type="button" className="text-lg font-semibold text-slate-700 disabled:opacity-40" onClick={() => setQuickViewQuantity((qty) => Math.min(Math.max(product.stock, 1), qty + 1))} disabled={quickViewQuantity >= Math.max(product.stock, 1) || outOfStock}>+</button>
                    </div>
                  </div>
                </div>
                <button type="button" className="btn-primary w-full gap-2" onClick={() => { addItem(product, selections, quickViewQuantity); setQuickViewOpen(false); }} disabled={outOfStock}>
                  <Plus className="h-4 w-4" />
                  {outOfStock ? "Out of Stock" : `Add ${quickViewQuantity} to Cart • Rs ${(pricing.price * quickViewQuantity).toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
