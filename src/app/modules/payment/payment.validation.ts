import { z } from "zod";

const createPaymentSchema = z.object({
  rentalRequestId: z.string().uuid("rentalRequestId must be a valid UUID")
});

const confirmPaymentSchema = z.object({
  transactionId: z.string().min(1, "transactionId is required"),
});

export const paymentValidation = {
  createPaymentSchema,
  confirmPaymentSchema,
};
