import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHelpers/AppError.js";
import { PropertyStatus } from "../../../generated/prisma/enums.js";
import type {
  IPropertyFilters,
  IPaginationOptions,
  IPropertyPayload,
} from "./property.interface.js";

// Landlord: Create

const createProperty = async (payload: IPropertyPayload, landlordId: string) => {
const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  const property = await prisma.property.create({
    data: { ...payload, landlordId },
    include: { category: true },
  });

  return property;
};

//Public: Browse with filters & pagination

const getAllProperties = async (
  filters: IPropertyFilters,
  pagination: IPaginationOptions,
) => {
  const {
    searchTerm,
    city,
    minPrice,
    maxPrice,
    categoryId,
    amenities,
    bedrooms,
    status,
  } = filters;

  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  // Compose AND conditions for flexible filtering
  const andConditions: object[] = [];

  // Default to showing only AVAILABLE properties on public browse
  andConditions.push({ status: status ?? PropertyStatus.AVAILABLE });

  if (city) {
    andConditions.push({ city: { contains: city, mode: "insensitive" } });
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  }

  if (bedrooms) {
    andConditions.push({ bedrooms: Number(bedrooms) });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    andConditions.push({
      monthlyRent: {
        ...(minPrice !== undefined && { gte: Number(minPrice) }),
        ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
      },
    });
  }

  if (amenities && amenities.length > 0) {
    // hasEvery: property must contain all requested amenities
    andConditions.push({ amenities: { hasEvery: amenities } });
  }

  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
        { city: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const where = { AND: andConditions };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties,
    meta: { page, limit, total },
  };
};

// Public: Get single property

const getPropertyById = async (id: string) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      category: true,
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      reviews: {
        include: {
          tenant: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  return property;
};

// Landlord: Update

const updateProperty = async (
  id: string,
  landlordId: string,
  payload: Partial<IPropertyPayload>,
) => {
  const existing = await prisma.property.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  if (existing.landlordId !== landlordId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this property",
    );
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    }
  }

  const updated = await prisma.property.update({
    where: { id },
    data: payload,
    include: { category: true },
  });

  return updated;
};

// Landlord: Delete

const deleteProperty = async (id: string, landlordId: string) => {
  const existing = await prisma.property.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  if (existing.landlordId !== landlordId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to delete this property",
    );
  }

  await prisma.property.delete({ where: { id } });
};

export const propertyService = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
};