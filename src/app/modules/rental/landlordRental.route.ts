import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { rentalController } from "./rental.controller.js";
import { rentalValidation } from "./rental.validation.js";

export const landlordRentalRouter: Router = Router();

// GET   /api/v1/landlord/requests — Landlord views requests for own properties
landlordRentalRouter.get(
  "/",
  auth(UserRole.LANDLORD),
  rentalController.getLandlordRequests,
);

// PATCH /api/v1/landlord/requests/:id  — Landlord approves or rejects a request
landlordRentalRouter.patch(
  "/:id",
  auth(UserRole.LANDLORD),
  validateRequest(rentalValidation.updateRentalStatusSchema),
  rentalController.updateRentalStatus,
);
