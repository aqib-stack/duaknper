"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/types/product";

type WishlistItem = Pick<Product, "id" | "storeId" | "name" | "slug" | "price" | "compareAtPrice" | "imageUrl" | "category" | "featured" | "stock">;

type WishlistContextType = {
  items: WishlistItem[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const storageKey = "dukanper-wishlist";

function toWishlistItem(product: Product): WishlistItem {
  return {
    id: product.id,
    storeId: product.storeId,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    imageUrl: product.imageUrl || "",
    category: product.category,
    featured: product.featured,
    stock: product.stock,
  };
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        setItems(JSON.parse(raw) as WishlistItem[]);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<WishlistContextType>(() => ({
    items,
    isWishlisted(productId) {
      return items.some((item) => item.id === productId);
    },
    toggleWishlist(product) {
      setItems((prev) => prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, toWishlistItem(product)]);
    },
    clearWishlist() {
      setItems([]);
    },
  }), [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}
