import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { reviewService } from "./review.service.js";

// Tenant: Submit a review

const createReview = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const review = await reviewService.createReview(tenantId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review submitted successfully",
    data: review,
  });
});

// Public: Get all reviews for a property

const getPropertyReviews = catchAsync(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const { page, limit } = req.query;

  const result = await reviewService.getPropertyReviews(
    propertyId as string,
    {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    },
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property reviews fetched successfully",
    data: result.reviews,
    meta: result.meta,
  });
});

export const reviewController = {
  createReview,
  getPropertyReviews,
};
