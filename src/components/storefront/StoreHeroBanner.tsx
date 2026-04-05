import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Clock3,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Store } from "@/types/store";

type Props = {
  store: Store;
  totalProducts: number;
  totalCategories: number;
};

type FeatureItem = [LucideIcon, string];
type StatItem = [string, string];

export function StoreHeroBanner({ store, totalProducts, totalCategories }: Props) {
  const featureItems: FeatureItem[] = [
    [Truck, "Fast dispatch options"],
    [ShieldCheck, "Trusted COD checkout"],
    [Clock3, "Quick order confirmation"],
    [BadgePercent, "Fresh deals and featured picks"],
  ];

  const statItems: StatItem[] = [
    [String(totalProducts), "Live products"],
    [String(totalCategories), "Collections"],
    ["Pakistan", "Delivery coverage"],
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-pink-100 bg-slate-950 text-white shadow-2xl shadow-pink-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.4),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.28),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.97),_rgba(30,41,59,0.96))]" />
      <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative grid gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:px-10 lg:py-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
            <Sparkles className="h-4 w-4" /> Featured storefront experience
          </span>

          <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight lg:text-5xl">
            {store.heroTitle || (
              <>
                Shop smarter from <span className="text-pink-300">{store.name}</span> with a premium online
                experience.
              </>
            )}
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 lg:text-lg">
            {store.heroSubtitle ||
              "Discover featured products, trusted Cash on Delivery checkout, and a polished shopping journey designed for fast-growing stores across Pakistan."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
            {featureItems.map(([Icon, label]) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
              >
                <Icon className="h-4 w-4 text-pink-300" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#products" className="btn-primary gap-2">
              Explore Collection <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
              className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {statItems.map(([value, label]) => (
            <div
              key={label}
              className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
            >
              <p className="text-sm text-slate-300">{label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}