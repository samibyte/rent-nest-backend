import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/checkAuth.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import { reviewController } from "./review.controller.js";
import { reviewValidation } from "./review.validation.js";

export const reviewRouter: Router = Router();

// POST /api/v1/reviews - Submit a review (TENANT only)
reviewRouter.post(
  "/",
  auth(UserRole.TENANT),
  validateRequest(reviewValidation.createReviewSchema),
  reviewController.createReview,
);

// GET /api/v1/reviews/property/:propertyId - Get all reviews for a property (Public)
reviewRouter.get(
  "/property/:propertyId",
  reviewController.getPropertyReviews,
);
