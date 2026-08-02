export interface ICreatePaymentPayload {
  rentalRequestId: string;
}

export interface IConfirmPaymentPayload {
  transactionId: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}
