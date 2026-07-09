import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { adminController } from "./admin.controller.js";
import { adminValidation } from "./admin.validation.js";

export const adminRouter: Router = Router();

// Protect all sub-routes to ADMIN role
adminRouter.use(auth(UserRole.ADMIN));

// GET /api/v1/admin/stats - Overview analytics dashboard statistics
adminRouter.get("/stats", adminController.getDashboardStats);

// GET /api/v1/admin/users - List users
adminRouter.get("/users", adminController.getAllUsers);

// PATCH /api/v1/admin/users/:id/status - Block or unblock a user
adminRouter.patch(
  "/users/:id/status",
  validateRequest(adminValidation.updateUserStatusSchema),
  adminController.updateUserStatus,
);

// GET /api/v1/admin/properties - View all properties (Issue #3)
adminRouter.get("/properties", adminController.getAllProperties);

// DELETE /api/v1/admin/properties/:id - Moderation delete of a property
adminRouter.delete("/properties/:id", adminController.deletePropertyListing);

// GET /api/v1/admin/rentals - View all rental requests (Issue #3)
adminRouter.get("/rentals", adminController.getAllRentals);
