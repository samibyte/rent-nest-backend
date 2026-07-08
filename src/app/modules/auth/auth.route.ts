import { Router } from "express";
import { authController } from "./auth.controller.js";
import { auth } from "../../middlewares/checkAuth.js";
import { UserRole } from "../../../generated/prisma/enums.js";

export const authRouter: Router = Router();

authRouter.post("/register", authController.registerUser);
authRouter.post("/login", authController.loginUser);
authRouter.get(
  "/me",
  auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT),
  authController.getMe,
);
