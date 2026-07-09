import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { propertyService } from "./property.service.js";
import { PropertyStatus } from "../../../generated/prisma/enums.js";

// Public Controllers

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    searchTerm,
    city,
    minPrice,
    maxPrice,
    categoryId,
    amenities,
    bedrooms,
    status,
  } = req.query;

  const filters = {
    searchTerm: searchTerm as string | undefined,
    city: city as string | undefined,
    minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
    categoryId: categoryId as string | undefined,
    // Accept comma-separated amenities: ?amenities=WiFi,AC,Parking
    amenities: amenities
      ? (amenities as string).split(",").map((a) => a.trim())
      : undefined,
    bedrooms: bedrooms !== undefined ? Number(bedrooms) : undefined,
    status: status as PropertyStatus | undefined,
  };

  const result = await propertyService.getAllProperties(filters, {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Properties fetched successfully",
    data: result.properties,
    meta: result.meta,
  });
});

const getPropertyById = catchAsync(async (req: Request, res: Response) => {
  const property = await propertyService.getPropertyById(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property fetched successfully",
    data: property,
  });
});

//Landlord Controllers

const createProperty = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const property = await propertyService.createProperty(req.body, landlordId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Property created successfully",
    data: property,
  });
});

const updateProperty = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const property = await propertyService.updateProperty(
    req.params.id as string,
    landlordId,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property updated successfully",
    data: property,
  });
});

const deleteProperty = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  await propertyService.deleteProperty(req.params.id as string, landlordId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property deleted successfully",
    data: null,
  });
});

export const propertyController = {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
