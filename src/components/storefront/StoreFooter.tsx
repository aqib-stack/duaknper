import Link from "next/link";
import type { Store } from "@/types/store";

export function StoreFooter({ store }: { store: Store }) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-app grid gap-8 py-12 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{store.name}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {store.description || "Premium online storefront powered by DukanPer."}
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Customer Support</h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Phone: {store.phone || "Not added"}</li>
            <li>WhatsApp: {store.whatsapp || "Not added"}</li>
            <li>Email: {store.supportEmail || "Not added"}</li>
            <li>{store.country || "Pakistan"}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Customer Links</h4>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/track-order">Track Order</Link>
            <Link href="/customer/login">Customer Login</Link>
            <Link href="/customer/signup">Create Account</Link>
            <Link href="/account">My Orders</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Shopping Info</h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Cash on Delivery available</li>
            <li>Powered by DukanPer</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
