export interface ICreatePaymentPayload {
  rentalRequestId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface IConfirmPaymentPayload {
  transactionId: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}
