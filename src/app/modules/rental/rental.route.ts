import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { rentalController } from "./rental.controller.js";
import { rentalValidation } from "./rental.validation.js";

export const rentalRouter: Router = Router();

// POST /api/v1/rentals     — Tenant submits a rental request
rentalRouter.post(
  "/",
  auth(UserRole.TENANT),
  validateRequest(rentalValidation.createRentalSchema),
  rentalController.createRentalRequest,
);

// GET /api/v1/rentals      — Tenant views own requests (supports ?status=, ?page=, ?limit=)
rentalRouter.get("/", auth(UserRole.TENANT), rentalController.getTenantRentals);

// GET /api/v1/rentals/:id  — Tenant views a single request
rentalRouter.get("/:id", auth(UserRole.TENANT), rentalController.getTenantRentalById);
