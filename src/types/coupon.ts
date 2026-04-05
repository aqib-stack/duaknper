export type CouponType = "percentage" | "fixed";

export type Coupon = {
  id: string;
  storeId: string;
  code: string;
  type: CouponType;
  value: number;
  minimumOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CouponInput = {
  storeId: string;
  code: string;
  type: CouponType;
  value: number;
  minimumOrder?: number;
  isActive?: boolean;
};
