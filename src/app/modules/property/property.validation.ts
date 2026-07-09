import { z } from "zod";
import { PropertyStatus } from "../../../generated/prisma/enums.js";

const createPropertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  area: z.string().optional(),
  monthlyRent: z.number().positive("Monthly rent must be a positive number"),
  securityDeposit: z.number().nonnegative("Security deposit cannot be negative").optional(),
  bedrooms: z.number().int().positive("Bedrooms must be a positive integer"),
  bathrooms: z.number().int().positive("Bathrooms must be a positive integer"),
  size: z.number().positive("Size must be a positive number").optional(),
  images: z.array(z.url("Each image must be a valid URL")).min(1, "At least one image URL is required"),
  amenities: z.array(z.string()).default([]),
  status: z.nativeEnum(PropertyStatus).optional().default(PropertyStatus.AVAILABLE),
  categoryId: z.string().uuid("categoryId must be a valid UUID"),
});

const updatePropertySchema = createPropertySchema.partial();

export const propertyValidation = {
  createPropertySchema,
  updatePropertySchema,
};
