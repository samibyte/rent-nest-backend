import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHelpers/AppError.js";
import { PaymentStatus, PropertyStatus, RentalStatus, UserRole } from "../../../generated/prisma/enums.js";
import type {
  AmenityMatch,
  IPropertyFilters,
  IPaginationOptions,
  IPropertyPayload,
  PropertySortBy,
  SortOrder,
} from "./property.interface.js";

// Landlord: Create

const createProperty = async (payload: IPropertyPayload, landlordId: string) => {
const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  if (payload.regionId) {
    const region = await prisma.region.findUnique({ where: { id: payload.regionId } });
    if (!region) {
      throw new AppError(httpStatus.NOT_FOUND, "Region not found");
    }
  }

  const property = await prisma.property.create({
    data: { ...payload, landlordId },
    include: { category: true, region: true },
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
  } = filters;

  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  // Compose AND conditions for flexible filtering
  const andConditions: object[] = [];

  // Default to showing only AVAILABLE properties on public browse
  andConditions.push({ status: status ?? PropertyStatus.AVAILABLE });

  // --- Location filters ---
  if (city) {
    andConditions.push({ city: { contains: city, mode: "insensitive" } });
  }

  if (area) {
    andConditions.push({ area: { contains: area, mode: "insensitive" } });
  }

  // --- Property type filter ---
  if (categoryId) {
    andConditions.push({ categoryId });
  }

  // --- Region filter ---
  if (regionId) {
    andConditions.push({ regionId });
  }

  // --- Bedroom filters (range takes precedence over exact match) ---
  if (minBedrooms !== undefined || maxBedrooms !== undefined) {
    andConditions.push({
      bedrooms: {
        ...(minBedrooms !== undefined && { gte: Number(minBedrooms) }),
        ...(maxBedrooms !== undefined && { lte: Number(maxBedrooms) }),
      },
    });
  } else if (bedrooms) {
    andConditions.push({ bedrooms: Number(bedrooms) });
  }

  // --- Bathroom filter ---
  if (bathrooms !== undefined) {
    andConditions.push({ bathrooms: Number(bathrooms) });
  }

  // --- Price range filter ---
  if (minPrice !== undefined || maxPrice !== undefined) {
    andConditions.push({
      monthlyRent: {
        ...(minPrice !== undefined && { gte: Number(minPrice) }),
        ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
      },
    });
  }

  // --- Amenities filter ---
  // amenityMatch=all (default): property must have EVERY requested amenity
  // amenityMatch=any           : property must have AT LEAST ONE requested amenity
  if (amenities && amenities.length > 0) {
    const matchMode: AmenityMatch = amenityMatch === "any" ? "any" : "all";
    andConditions.push(
      matchMode === "any"
        ? { amenities: { hasSome: amenities } }
        : { amenities: { hasEvery: amenities } },
    );
  }

  // --- Full-text search (covers area field too) ---
  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
        { city: { contains: searchTerm, mode: "insensitive" } },
        { area: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const where = { AND: andConditions };

  // Build orderBy — default to newest first
  const ALLOWED_SORT_FIELDS: PropertySortBy[] = ["monthlyRent", "createdAt", "bedrooms"];
  const resolvedSortBy: PropertySortBy =
    sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "createdAt";
  const resolvedSortOrder: SortOrder = sortOrder === "asc" ? "asc" : "desc";

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        region: true,
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
      orderBy: { [resolvedSortBy]: resolvedSortOrder },
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
      region: true,
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

  if (payload.regionId) {
    const region = await prisma.region.findUnique({ where: { id: payload.regionId } });
    if (!region) {
      throw new AppError(httpStatus.NOT_FOUND, "Region not found");
    }
  }

  const updated = await prisma.property.update({
    where: { id },
    data: payload,
    include: { category: true, region: true },
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

  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { propertyId: id } });

    const rentalIds = await tx.rentalRequest.findMany({
      where: { propertyId: id },
      select: { id: true },
    });
    await tx.payment.deleteMany({
      where: { rentalRequestId: { in: rentalIds.map((r) => r.id) } },
    });

 
    await tx.rentalRequest.deleteMany({ where: { propertyId: id } });

    await tx.property.delete({ where: { id } });
  });
};

// Landlord: Get own properties

const getMyProperties = async (
  landlordId: string,
  filters: Pick<IPropertyFilters, "status">,
  pagination: IPaginationOptions,
) => {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const where = {
    landlordId,
    ...(filters.status && { status: filters.status }),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        region: true,
        _count: {
          select: { rentalRequests: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, meta: { page, limit, total } };
};

// Landlord: Dashboard stats scoped to own data

const getLandlordDashboardStats = async (landlordId: string) => {
  const [
    propertyCounts,
    activeRentals,
    pendingRequests,
    revenue,
    totalReviews,
  ] = await Promise.all([
    // Breakdown of own properties by status
    prisma.property.groupBy({
      by: ["status"],
      where: { landlordId },
      _count: { id: true },
    }),

    // Currently active leases
    prisma.rentalRequest.count({
      where: {
        property: { landlordId },
        status: RentalStatus.ACTIVE,
      },
    }),

    // Requests awaiting landlord action
    prisma.rentalRequest.count({
      where: {
        property: { landlordId },
        status: RentalStatus.PENDING,
      },
    }),

    // Total revenue from completed payments on own properties
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.COMPLETED,
        rentalRequest: { property: { landlordId } },
      },
      _sum: { amount: true },
    }),

    // Total reviews received across all own properties
    prisma.review.count({
      where: { property: { landlordId } },
    }),
  ]);

  // Shape the grouped property counts into a readable object
  const propertyStats = {
    total: 0,
    available: 0,
    rented: 0,
    unavailable: 0,
  };

  propertyCounts.forEach((group) => {
    propertyStats.total += group._count.id;
    if (group.status === PropertyStatus.AVAILABLE)
      propertyStats.available = group._count.id;
    if (group.status === PropertyStatus.RENTED)
      propertyStats.rented = group._count.id;
    if (group.status === PropertyStatus.UNAVAILABLE)
      propertyStats.unavailable = group._count.id;
  });

  return {
    properties: propertyStats,
    rentals: {
      active: activeRentals,
      pendingRequests,
    },
    revenue: {
      totalAmount: revenue._sum.amount ?? 0,
    },
    reviews: {
      total: totalReviews,
    },
  };
};

// Public Stats (In-Memory Cache)
let cachedStats: any = null;
let cacheExpiry = 0;

const getPublicStats = async () => {
  const now = Date.now();
  if (cachedStats && now < cacheExpiry) {
    return cachedStats;
  }

  const [
    totalProperties,
    activeLeases,
    totalTenants,
    totalLandlords,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.rentalRequest.count({
      where: {
        status: RentalStatus.ACTIVE,
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.TENANT,
        status: "ACTIVE",
      },
    }),
    prisma.user.count({
      where: {
        role: UserRole.LANDLORD,
        status: "ACTIVE",
      },
    }),
  ]);

  cachedStats = {
    totalProperties,
    activeLeases,
    totalTenants,
    totalLandlords,
  };

  // Cache for 5 minutes
  cacheExpiry = now + 5 * 60 * 1000;

  return cachedStats;
};

// Public: Get all distinct amenities used across properties
const getDistinctAmenities = async (): Promise<string[]> => {
  const rows = await prisma.property.findMany({
    select: { amenities: true },
    where: { amenities: { isEmpty: false } },
  });

  const all = rows.flatMap((r) => r.amenities);
  const distinct = [...new Set(all)].sort();
  return distinct;
};

export const propertyService = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getLandlordDashboardStats,
  getPublicStats,
  getDistinctAmenities,
};