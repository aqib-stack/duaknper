export type SelectedVariant = {
  name: string;
  value: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  selectedVariants?: SelectedVariant[];
};

export type OrderStatus = "pending" | "confirmed" | "processing" | "delivered" | "cancelled" | "completed";
export type OrderSource = "online" | "offline";
export type OrderPaymentMethod = "cod" | "cash";

export type CreateOrderInput = {
  storeId: string;
  storeSlug: string;
  customerName: string;
  customerEmail?: string;
  customerId?: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  paymentMethod: OrderPaymentMethod;
  source?: OrderSource;
  status?: OrderStatus;
  receiptNumber?: string;
  cashReceived?: number;
  changeAmount?: number;
};

export type Order = CreateOrderInput & {
  id: string;
  status: OrderStatus;
  source: OrderSource;
  receiptNumber: string;
  createdAt: string;
  updatedAt: string;
};
