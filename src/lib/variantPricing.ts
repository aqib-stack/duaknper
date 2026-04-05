import type { Product } from "@/types/product";
import type { SelectedVariant } from "@/types/order";

const SIZE_SCALE: Record<string, number> = {
  xs: 0.8,
  s: 1,
  m: 1.15,
  l: 1.3,
  xl: 1.5,
  xxl: 1.7,
};

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function parseMeasurable(value: string) {
  const normalized = normalizeValue(value);
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml)/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) return null;

  switch (unit) {
    case "kg":
      return { family: "weight", base: amount * 1000 };
    case "g":
      return { family: "weight", base: amount };
    case "l":
      return { family: "volume", base: amount * 1000 };
    case "ml":
      return { family: "volume", base: amount };
    default:
      return null;
  }
}

function findReferenceValue(product: Product, selectedVariants: SelectedVariant[]) {
  for (const selected of selectedVariants) {
    const measurable = parseMeasurable(selected.value);
    if (measurable) {
      const fromName = parseMeasurable(product.name);
      if (fromName && fromName.family === measurable.family) {
        return measurable.base / fromName.base;
      }
    }

    const normalized = normalizeValue(selected.value);
    if (SIZE_SCALE[normalized]) {
      const productNameNormalized = normalizeValue(product.name);
      const matchedSize = Object.keys(SIZE_SCALE).find((size) => new RegExp(`(^|[^a-z])${size}([^a-z]|$)`, "i").test(productNameNormalized));
      const reference = matchedSize ? SIZE_SCALE[matchedSize] : 1;
      return SIZE_SCALE[normalized] / reference;
    }
  }

  return 1;
}

export function resolveVariantPricing(product: Product, selectedVariants: SelectedVariant[] = []) {
  const multiplier = findReferenceValue(product, selectedVariants);
  const price = Math.max(0, Math.round(product.price * multiplier));
  const compareAtPrice = product.compareAtPrice ? Math.max(price, Math.round(product.compareAtPrice * multiplier)) : null;
  return { price, compareAtPrice, multiplier };
}
