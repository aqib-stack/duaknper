export const STORE_CATEGORIES = [
  "Grocery",
  "Fashion",
  "Electronics",
  "Beauty",
  "Pharmacy",
  "Restaurants",
  "Bakery",
  "General Store",
] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

export const DEFAULT_STORE_CATEGORY: StoreCategory = "General Store";

export function normalizeStoreCategory(value?: string | null): StoreCategory {
  const cleaned = String(value || "").trim();
  const match = STORE_CATEGORIES.find((category) => category.toLowerCase() === cleaned.toLowerCase());
  return match || DEFAULT_STORE_CATEGORY;
}
