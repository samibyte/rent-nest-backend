import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { propertyController } from "./property.controller.js";
import { propertyValidation } from "./property.validation.js";

export const landlordPropertyRouter: Router = Router();

// GET    /api/v1/landlord/stats        — Dashboard overview stats
landlordPropertyRouter.get(
  "/stats",
  auth(UserRole.LANDLORD),
  propertyController.getLandlordDashboardStats,
);

// GET    /api/v1/landlord/properties  — List own properties (supports ?status=, ?page=, ?limit=)
landlordPropertyRouter.get(
  "/",
  auth(UserRole.LANDLORD),
  propertyController.getMyProperties,
);

// POST   /api/v1/landlord/properties  — Create a new listing
landlordPropertyRouter.post(
  "/",
  auth(UserRole.LANDLORD),
  validateRequest(propertyValidation.createPropertySchema),
  propertyController.createProperty,
);

// PUT    /api/v1/landlord/properties/:id  — Update own listing
landlordPropertyRouter.put(
  "/:id",
  auth(UserRole.LANDLORD),
  validateRequest(propertyValidation.updatePropertySchema),
  propertyController.updateProperty,
);

// DELETE /api/v1/landlord/properties/:id  — Delete own listing
landlordPropertyRouter.delete(
  "/:id",
  auth(UserRole.LANDLORD),
  propertyController.deleteProperty,
);
