"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductVariant } from "@/types/product";
import type { SelectedVariant } from "@/types/order";
import { resolveVariantPricing } from "@/lib/variantPricing";

type CartItem = {
  key: string;
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  stock: number;
  selectedVariants?: SelectedVariant[];
};

type AppliedCoupon = {
  code: string;
  discountAmount: number;
};

type StoreCartContextType = {
  items: CartItem[];
  addItem: (product: Product, selectedVariants?: SelectedVariant[], quantity?: number) => void;
  increaseQty: (key: string) => void;
  decreaseQty: (key: string) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
};

const StoreCartContext = createContext<StoreCartContextType | undefined>(undefined);

function makeKey(productId: string, selectedVariants?: SelectedVariant[]) {
  const signature = (selectedVariants || []).map((v) => `${v.name}:${v.value}`).join("|");
  return `${productId}__${signature}`;
}

export function getDefaultVariantSelections(variants?: ProductVariant[]) {
  return (variants || [])
    .filter((group) => group.values.length > 0)
    .map((group) => ({ name: group.name, value: group.values[0] }));
}

export function StoreCartProvider({ children, storeSlug }: { children: ReactNode; storeSlug: string }) {
  const storageKey = `dukanper-cart-${storeSlug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCouponState] = useState<AppliedCoupon | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CartItem[] | { items?: CartItem[]; appliedCoupon?: AppliedCoupon | null };
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else {
          setItems(parsed.items || []);
          setAppliedCouponState(parsed.appliedCoupon || null);
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ items, appliedCoupon }));
  }, [items, appliedCoupon, ready, storageKey]);

  const value = useMemo<StoreCartContextType>(() => ({
    items,
    addItem(product, selectedVariants = getDefaultVariantSelections(product.variants), quantity = 1) {
      const key = makeKey(product.id, selectedVariants);
      const pricing = resolveVariantPricing(product, selectedVariants);
      setItems((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          return prev.map((item) =>
            item.key === key
              ? { ...item, quantity: Math.min(item.quantity + quantity, Math.max(product.stock, 1)), stock: product.stock, price: pricing.price }
              : item,
          );
        }

        return [
          ...prev,
          {
            key,
            productId: product.id,
            name: product.name,
            price: pricing.price,
            imageUrl: product.imageUrl,
            quantity: Math.min(Math.max(quantity, 1), Math.max(product.stock, 1)),
            stock: product.stock,
            selectedVariants,
          },
        ];
      });
    },
    increaseQty(key) {
      setItems((prev) =>
        prev.map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(item.quantity + 1, Math.max(item.stock, 1)) }
            : item,
        ),
      );
    },
    decreaseQty(key) {
      setItems((prev) =>
        prev
          .map((item) => (item.key === key ? { ...item, quantity: item.quantity - 1 } : item))
          .filter((item) => item.quantity > 0),
      );
    },
    removeItem(key) {
      setItems((prev) => prev.filter((item) => item.key !== key));
    },
    clearCart() {
      setItems([]);
      setAppliedCouponState(null);
    },
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    appliedCoupon,
    setAppliedCoupon(coupon) {
      setAppliedCouponState(coupon);
    },
  }), [items, appliedCoupon]);

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>;
}

export function useStoreCart() {
  const context = useContext(StoreCartContext);
  if (!context) {
    throw new Error("useStoreCart must be used within StoreCartProvider");
  }
  return context;
}
