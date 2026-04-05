export type SubscriptionStatus = 'trial' | 'active' | 'pending_payment_review' | 'expired' | 'suspended';
export type PaymentProofStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'Easypaisa' | 'JazzCash' | 'Bank Transfer' | 'SadaPay/NayaPay' | 'Wise';

export type PaymentProof = {
  id: string;
  storeId: string;
  ownerId: string;
  storeName: string;
  ownerName: string;
  ownerEmail: string;
  amount: number;
  currency: 'PKR' | 'USD';
  paymentMethod: PaymentMethod;
  transactionId: string;
  screenshotUrl: string;
  screenshotPath?: string;
  note?: string;
  status: PaymentProofStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};
