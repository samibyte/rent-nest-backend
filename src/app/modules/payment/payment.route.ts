import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { paymentController } from "./payment.controller.js";
import { paymentValidation } from "./payment.validation.js";

export const paymentRouter: Router = Router();

// POST /api/v1/payments/create   — Create a PENDING payment session for an APPROVED rental
paymentRouter.post(
  "/create",
  auth(UserRole.TENANT),
  validateRequest(paymentValidation.createPaymentSchema),
  paymentController.createPayment,
);

// POST /api/v1/payments/confirm  — Confirm payment; marks payment COMPLETED + rental ACTIVE
paymentRouter.post(
  "/confirm",
  auth(UserRole.TENANT),
  validateRequest(paymentValidation.confirmPaymentSchema),
  paymentController.confirmPayment,
);

// GET  /api/v1/payments          — Tenant payment history
paymentRouter.get("/", auth(UserRole.TENANT), paymentController.getMyPayments);

// GET  /api/v1/payments/:id      — Single payment detail
paymentRouter.get("/:id", auth(UserRole.TENANT), paymentController.getPaymentById);
