import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "./auth.controller.js";
import { auth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { authValidation } from "./auth.validation.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { multerUpload } from "../../config/multer.config.js";

export const authRouter: Router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
});

authRouter.post(
  "/register",
  authRateLimiter,
  multerUpload.single("avatar"),
  validateRequest(authValidation.registerSchema),
  authController.registerUser,
);

authRouter.post(
  "/login",
  authRateLimiter,
  validateRequest(authValidation.loginSchema),
  authController.loginUser,
);

authRouter.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT),
  authController.getMe,
);

authRouter.patch(
  "/me/avatar",
  auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT),
  multerUpload.single("avatar"),
  authController.updateAvatar,
);
