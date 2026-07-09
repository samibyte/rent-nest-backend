import { z } from "zod";
import { UserRole } from "../../../generated/prisma/enums.js";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password cannot exceed 72 characters"),
  phone: z.string().optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional(),
  role: z.enum([UserRole.TENANT, UserRole.LANDLORD], {
    error: "Role must be either TENANT or LANDLORD",
  }),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const authValidation = {
  registerSchema,
  loginSchema,
};
