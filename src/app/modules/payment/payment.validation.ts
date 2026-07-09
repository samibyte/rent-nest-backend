import { z } from "zod";

const createPaymentSchema = z.object({
  rentalRequestId: z.string().uuid("rentalRequestId must be a valid UUID"),
  successUrl: z.string().url("successUrl must be a valid URL").optional(),
  cancelUrl: z.string().url("cancelUrl must be a valid URL").optional(),
});

const confirmPaymentSchema = z.object({
  transactionId: z.string().min(1, "transactionId is required"),
});

export const paymentValidation = {
  createPaymentSchema,
  confirmPaymentSchema,
};
