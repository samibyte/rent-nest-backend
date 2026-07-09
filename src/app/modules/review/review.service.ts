import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHelpers/AppError.js";
import { RentalStatus } from "../../../generated/prisma/enums.js";
import type { ICreateReviewPayload, IPaginationOptions } from "./review.interface.js";

// Tenant: Submit a review for a property

const createReview = async (tenantId: string, payload: ICreateReviewPayload) => {
  const { propertyId, rating, comment } = payload;

  // 1. Verify property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  // 2. Verify tenant has actually rented this property (RentalRequest status must be ACTIVE or COMPLETED)
  const activeOrCompletedRental = await prisma.rentalRequest.findFirst({
    where: {
      tenantId,
      propertyId,
      status: {
        in: [RentalStatus.ACTIVE, RentalStatus.COMPLETED],
      },
    },
  });

  if (!activeOrCompletedRental) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can only review properties that you have rented (with rental request status ACTIVE or COMPLETED).",
    );
  }

  // 3. Pre-emptively check for duplicate reviews to prevent unique constraint failures
  const existingReview = await prisma.review.findUnique({
    where: {
      tenantId_propertyId: {
        tenantId,
        propertyId,
      },
    },
  });

  if (existingReview) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You have already submitted a review for this property.",
    );
  }

  // 4. Create review
  const review = await prisma.review.create({
    data: {
      tenantId,
      propertyId,
      rating,
      comment,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return review;
};

// Public: Get all reviews for a property

const getPropertyReviews = async (propertyId: string, pagination: IPaginationOptions) => {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  // Verify property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { propertyId },
      skip,
      take: limit,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({
      where: { propertyId },
    }),
  ]);

  return {
    reviews,
    meta: {
      page,
      limit,
      total,
    },
  };
};

export const reviewService = {
  createReview,
  getPropertyReviews,
};
