import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { rentalService } from "./rental.service.js";
import { RentalStatus } from "../../../generated/prisma/enums.js";

// Tenant: Create rental request

const createRentalRequest = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const rental = await rentalService.createRentalRequest(tenantId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Rental request submitted successfully",
    data: rental,
  });
});

// Tenant: Get own rental requests

const getTenantRentals = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const { page, limit, status, propertyId } = req.query;

  const result = await rentalService.getTenantRentals(
    tenantId,
    {
      status: status as RentalStatus | undefined,
      propertyId: propertyId as string | undefined,
    },
    { page: Number(page) || 1, limit: Number(limit) || 10 },
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental requests fetched successfully",
    data: result.rentals,
    meta: result.meta,
  });
});

// Tenant: Get single rental request

const getTenantRentalById = catchAsync(async (req: Request, res: Response) => {
  const tenantId = req.user!.id;
  const rental = await rentalService.getTenantRentalById(
    req.params.id as string,
    tenantId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental request fetched successfully",
    data: rental,
  });
});

// Landlord: Get all requests for own properties

const getLandlordRequests = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const { page, limit, status, propertyId } = req.query;

  const result = await rentalService.getLandlordRequests(
    landlordId,
    {
      status: status as RentalStatus | undefined,
      propertyId: propertyId as string | undefined,
    },
    { page: Number(page) || 1, limit: Number(limit) || 10 },
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental requests fetched successfully",
    data: result.requests,
    meta: result.meta,
  });
});

// Landlord: Approve or reject a request

const updateRentalStatus = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const { status } = req.body;

  const updated = await rentalService.updateRentalStatus(
    req.params.id as string,
    landlordId,
    status,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Rental request ${status.toLowerCase()} successfully`,
    data: updated,
  });
});

export const rentalController = {
  createRentalRequest,
  getTenantRentals,
  getTenantRentalById,
  getLandlordRequests,
  updateRentalStatus,
};
