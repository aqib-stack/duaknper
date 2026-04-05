export type ProductStatus = "draft" | "published";

export type ProductVariant = {
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  storeId: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  imagePath?: string;
  stock: number;
  featured: boolean;
  status: ProductStatus;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  storeId: string;
  ownerId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  imagePath?: string;
  stock: number;
  featured?: boolean;
  status?: ProductStatus;
  variants?: ProductVariant[];
};
