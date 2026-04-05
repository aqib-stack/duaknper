import Link from "next/link";
import { ShoppingBag, Sparkles, MessageCircle, Store as StoreIcon, UserCircle2, MapPinned } from "lucide-react";
import type { Store } from "@/types/store";

type StoreHeaderProps = {
  store: Store;
  totalItems: number;
};

export function StoreHeader({ store, totalItems }: StoreHeaderProps) {
  const whatsappNumber = store.whatsapp.replace(/\D/g, "");

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
      <div className="bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 text-white">
        <div className="container-app flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4" /> {store.announcementText || "Premium shopping experience powered by DukanPer"}
          </span>
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            <span className="inline-flex items-center gap-1.5"><MapPinned className="h-4 w-4" /> {store.city}</span>
            <a href={`https://wa.me/${whatsappNumber}`} className="inline-flex items-center gap-1.5 hover:text-white">
              <MessageCircle className="h-4 w-4" /> WhatsApp support
            </a>
          </div>
        </div>
      </div>

      <div className="container-app flex flex-col gap-5 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 text-xl font-bold text-white shadow-lg shadow-pink-200">
            {store.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600">
              <StoreIcon className="h-4 w-4" /> DukanPer Storefront
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">{store.name}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">{store.description || `Order online from ${store.name} with a polished shopping experience.`}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <Link href="/account" className="btn-secondary gap-2"><UserCircle2 className="h-4 w-4" /> My Account</Link>
          <Link href={`/track-order?store=${store.slug}`} className="btn-secondary">Track Order</Link>
          <Link href={`/store/${store.slug}/checkout`} className="btn-primary gap-2">
            <ShoppingBag className="h-4 w-4" /> Cart ({totalItems})
          </Link>
        </div>
      </div>
    </header>
  );
}
