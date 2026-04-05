"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { CartSummary } from "@/components/storefront/CartSummary";
import { useStoreCart } from "@/contexts/StoreCartContext";

export function FloatingCartButton({ storeSlug }: { storeSlug: string }) {
  const { totalItems, subtotal } = useStoreCart();
  const [open, setOpen] = useState(false);
  const prevItemsRef = useRef(totalItems);

  useEffect(() => {
    const prevItems = prevItemsRef.current;
    if (totalItems > prevItems) {
      setOpen(true);
    }
    if (totalItems === 0) {
      setOpen(false);
    }
    prevItemsRef.current = totalItems;
  }, [totalItems]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full bg-slate-950 px-5 py-4 text-white shadow-2xl shadow-slate-900/25 transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-pink-600">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-slate-900">
              {totalItems}
            </span>
          ) : null}
        </span>
        <span className="text-left">
          <span className="block text-xs uppercase tracking-[0.2em] text-white/60">Cart</span>
          <span className="block text-sm font-semibold">{totalItems > 0 ? `Rs ${subtotal.toLocaleString()}` : "View cart"}</span>
        </span>
      </button>

      <div
        className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-[420px] transform border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Cart drawer</p>
              <h3 className="text-lg font-semibold text-slate-900">Your order summary</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[calc(100vh-82px)] overflow-y-auto p-5">
            <CartSummary storeSlug={storeSlug} floating />
          </div>
        </div>
      </div>
    </>
  );
}
