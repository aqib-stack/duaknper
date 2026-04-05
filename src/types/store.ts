import type { StoreCategory } from "@/lib/constants/storeCategories";
import type { SubscriptionStatus } from "@/types/subscription";

export type Store = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  phone: string;
  whatsapp: string;
  city: string;
  category: StoreCategory;
  currency: "PKR";
  status: "active" | "suspended";
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: string;
  trialEndsAt?: string;
  nextBillingAt?: string;
  paymentStatus?: "none" | "pending" | "approved" | "rejected";
  paymentMethod?: string;
  amountPaid?: number;
  transactionId?: string;
  theme: string;
  supportEmail?: string;
  country?: string;
  address?: string;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
  minimumOrderAmount?: number;
  enableCoupons?: boolean;
  enableOrderTracking?: boolean;
  announcementText?: string;
  deliveryEstimate?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  featuredSectionTitle?: string;
  featuredSectionSubtitle?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateStoreInput = {
  ownerId: string;
  name: string;
  slug?: string;
  description?: string;
  phone: string;
  whatsapp: string;
  city: string;
  category: StoreCategory;
  paymentMethod?: string;
  amountPaid?: number;
  transactionId?: string;
};

export type UpdateStoreInput = Partial<Omit<Store, "id" | "ownerId" | "createdAt" | "updatedAt">>;
