import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHelpers/AppError.js";
import { PropertyStatus, RentalStatus } from "../../../generated/prisma/enums.js";
import type {
  ICreateRentalPayload,
  IRentalFilters,
  IPaginationOptions,
} from "./rental.interface.js";

// Tenant: Create rental request

const createRentalRequest = async (
  tenantId: string,
  payload: ICreateRentalPayload,
) => {
  const { propertyId, moveInDate, message } = payload;

  // 1. Check the property exists and is available
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  if (property.status !== PropertyStatus.AVAILABLE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This property is not available for rental",
    );
  }

  // 2. Prevent duplicate active requests (PENDING or APPROVED)
  const existingRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId,
      propertyId,
      status: { in: [RentalStatus.PENDING, RentalStatus.APPROVED] },
    },
  });

  if (existingRequest) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have an active rental request for this property",
    );
  }

  const rentalRequest = await prisma.rentalRequest.create({
    data: {
      tenantId,
      propertyId,
      moveInDate: new Date(moveInDate),
      message,
    },
    include: {
      property: {
        include: {
          category: true,
          landlord: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  return rentalRequest;
};

// Tenant: Get all own rental requests

const getTenantRentals = async (
  tenantId: string,
  filters: IRentalFilters,
  pagination: IPaginationOptions,
) => {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const where: object = {
    tenantId,
    ...(filters.status && { status: filters.status }),
    ...(filters.propertyId && { propertyId: filters.propertyId }),
  };

  const [rentals, total] = await Promise.all([
    prisma.rentalRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        payment: true,
        property: {
          include: {
            category: true,
            landlord: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rentalRequest.count({ where }),
  ]);

  return { rentals, meta: { page, limit, total } };
};

// Tenant: Get single rental request by ID

const getTenantRentalById = async (id: string, tenantId: string) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id },
    include: {
      payment: true,
      property: {
        include: {
          category: true,
          landlord: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!rental) {
    throw new AppError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  if (rental.tenantId !== tenantId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this rental request",
    );
  }

  return rental;
};

// Landlord: Get all requests for own properties

const getLandlordRequests = async (
  landlordId: string,
  filters: IRentalFilters,
  pagination: IPaginationOptions,
) => {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const where: object = {
    property: { landlordId },
    ...(filters.status && { status: filters.status }),
    ...(filters.propertyId && { propertyId: filters.propertyId }),
  };

  const [requests, total] = await Promise.all([
    prisma.rentalRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        property: { include: { category: true } },
        tenant: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rentalRequest.count({ where }),
  ]);

  return { requests, meta: { page, limit, total } };
};

// Landlord: Approve or reject a rental request

const updateRentalStatus = async (
  id: string,
  landlordId: string,
  status: Extract<RentalStatus, "APPROVED" | "REJECTED">,
) => {
  // Fetch the request with property to verify ownership
  const rental = await prisma.rentalRequest.findUnique({
    where: { id },
    include: { property: true },
  });

  if (!rental) {
    throw new AppError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  if (rental.property.landlordId !== landlordId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only manage requests for your own properties",
    );
  }

  if (rental.status !== RentalStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot update a request that is already ${rental.status}`,
    );
  }

  const updated = await prisma.rentalRequest.update({
    where: { id },
    data: { status },
    include: {
      property: { include: { category: true } },
      tenant: {
        select: { id: true, name: true, email: true, phone: true, avatar: true },
      },
    },
  });

  return updated;
};

export const rentalService = {
  createRentalRequest,
  getTenantRentals,
  getTenantRentalById,
  getLandlordRequests,
  updateRentalStatus,
};
