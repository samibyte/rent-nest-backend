import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { propertyService } from "./property.service.js";
import { PropertyStatus } from "../../../generated/prisma/enums.js";
import type { AmenityMatch, PropertySortBy, SortOrder } from "./property.interface.js";

// Public Controllers

const getAllProperties = catchAsync(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    searchTerm,
    city,
    area,
    minPrice,
    maxPrice,
    categoryId,
    regionId,
    amenities,
    amenityMatch,
    bedrooms,
    minBedrooms,
    maxBedrooms,
    bathrooms,
    status,
    sortBy,
    sortOrder,
  } = req.query;

  const filters = {
    searchTerm: searchTerm as string | undefined,
    city: city as string | undefined,
    area: area as string | undefined,
    minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
    categoryId: categoryId as string | undefined,
    regionId: regionId as string | undefined,
    // Accept comma-separated amenities: ?amenities=WiFi,AC,Parking
    amenities: amenities
      ? (amenities as string).split(",").map((a) => a.trim())
      : undefined,
    amenityMatch: amenityMatch as AmenityMatch | undefined,
    bedrooms: bedrooms !== undefined ? Number(bedrooms) : undefined,
    minBedrooms: minBedrooms !== undefined ? Number(minBedrooms) : undefined,
    maxBedrooms: maxBedrooms !== undefined ? Number(maxBedrooms) : undefined,
    bathrooms: bathrooms !== undefined ? Number(bathrooms) : undefined,
    status: status as PropertyStatus | undefined,
    sortBy: sortBy as PropertySortBy | undefined,
    sortOrder: sortOrder as SortOrder | undefined,
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

const getMyProperties = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const { page, limit, status } = req.query;

  const result = await propertyService.getMyProperties(
    landlordId,
    { status: status as PropertyStatus | undefined },
    { page: Number(page) || 1, limit: Number(limit) || 10 },
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your properties fetched successfully",
    data: result.properties,
    meta: result.meta,
  });
});

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

const getLandlordDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const landlordId = req.user!.id;
  const stats = await propertyService.getLandlordDashboardStats(landlordId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard stats fetched successfully",
    data: stats,
  });
});

const getPublicStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await propertyService.getPublicStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Public statistics retrieved successfully",
    data: stats,
  });
});

const getDistinctAmenities = catchAsync(async (_req: Request, res: Response) => {
  const amenities = await propertyService.getDistinctAmenities();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Distinct amenities fetched successfully",
    data: amenities,
  });
});

export const propertyController = {
  getAllProperties,
  getPropertyById,
  getMyProperties,
  getLandlordDashboardStats,
  createProperty,
  updateProperty,
  deleteProperty,
  getPublicStats,
  getDistinctAmenities,
};

