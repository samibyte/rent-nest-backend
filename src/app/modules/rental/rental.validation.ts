import { z } from "zod";
import { RentalStatus } from "../../../generated/prisma/enums.js";

const createRentalSchema = z.object({
  propertyId: z.string().uuid("propertyId must be a valid UUID"),
  moveInDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "moveInDate must be a valid date string" })
    .refine((val) => new Date(val) > new Date(), {
      message: "moveInDate must be a future date",
    }),
  message: z.string().max(500, "Message cannot exceed 500 characters").optional(),
});

// Landlord can only set APPROVED or REJECTED via PATCH
const updateRentalStatusSchema = z.object({
  status: z.enum([RentalStatus.APPROVED, RentalStatus.REJECTED], {
    error: "Status must be either APPROVED or REJECTED",
  }),
});

export const rentalValidation = {
  createRentalSchema,
  updateRentalStatusSchema,
};
