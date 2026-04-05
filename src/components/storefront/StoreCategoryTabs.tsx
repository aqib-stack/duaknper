import { Layers3 } from "lucide-react";

type Props = {
  categories: string[];
};

export function StoreCategoryTabs({ categories }: Props) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="#products"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <Layers3 className="h-4 w-4" /> All products
        </a>
        {categories.map((category) => (
          <a
            key={category}
            href={`#category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"
          >
            {category}
          </a>
        ))}
      </div>
    </section>
  );
}
