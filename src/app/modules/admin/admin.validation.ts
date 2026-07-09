import { z } from "zod";
import { UserStatus } from "../../../generated/prisma/enums.js";

const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const adminValidation = {
  updateUserStatusSchema,
};
