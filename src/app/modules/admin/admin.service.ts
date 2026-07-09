import httpStatus from "http-status";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../errorHelpers/AppError.js";
import { PaymentStatus, UserRole, UserStatus } from "../../../generated/prisma/enums.js";
import type { IUserFilters, IPaginationOptions } from "./admin.interface.js";

// Admin: Get Dashboard analytics & overview

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalProperties,
    totalRentals,
    completedPayments,
    roleCounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.rentalRequest.count(),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: {
        id: true,
      },
    }),
  ]);

  // Map role count array to formatted object
  const usersByRole = {
    LANDLORD: 0,
    TENANT: 0,
    ADMIN: 0,
  };

  roleCounts.forEach((group) => {
    if (group.role in usersByRole) {
      usersByRole[group.role as keyof typeof usersByRole] = group._count.id;
    }
  });

  return {
    users: {
      total: totalUsers,
      breakdown: usersByRole,
    },
    properties: {
      total: totalProperties,
    },
    rentals: {
      total: totalRentals,
    },
    revenue: {
      totalAmount: completedPayments._sum.amount || 0,
    },
  };
};

// Admin: Retrieve all users (filterable, paginated)

const getAllUsers = async (filters: IUserFilters, pagination: IPaginationOptions) => {
  const { searchTerm, role, status, email } = filters;
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const andConditions: object[] = [];

  if (role) {
    andConditions.push({ role });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (email) {
    andConditions.push({ email: { contains: email, mode: "insensitive" } });
  }

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      total,
    },
  };
};

// Admin: Update user account status (ACTIVE or BANNED)

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Prevent admin from banning themselves
  if (user.role === UserRole.ADMIN && status === UserStatus.BANNED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Administrative accounts cannot be banned by themselves or others.",
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// Admin: Moderate & Force Delete property listing

const deletePropertyListing = async (propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  // Use a transaction to clean up related dependants properly before delete
  await prisma.$transaction(async (tx) => {
    // Delete reviews
    await tx.review.deleteMany({
      where: { propertyId },
    });

    // Delete payments associated with rental requests of this property
    const rentalIds = await tx.rentalRequest.findMany({
      where: { propertyId },
      select: { id: true },
    });
    const ids = rentalIds.map((r) => r.id);

    await tx.payment.deleteMany({
      where: { rentalRequestId: { in: ids } },
    });

    // Delete rental requests
    await tx.rentalRequest.deleteMany({
      where: { propertyId },
    });

    // Delete property
    await tx.property.delete({
      where: { id: propertyId },
    });
  });
};

// Admin: Get all properties (moderation view)

const getAllProperties = async (pagination: IPaginationOptions) => {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      skip,
      take: limit,
      include: {
        category: true,
        landlord: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: { rentalRequests: true, reviews: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count(),
  ]);

  return { properties, meta: { page, limit, total } };
};

// Admin: Get all rental requests (moderation view)

const getAllRentals = async (
  filters: { status?: string },
  pagination: IPaginationOptions,
) => {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 10;
  const skip = (page - 1) * limit;

  const where = filters.status ? { status: filters.status as any } : {};

  const [rentals, total] = await Promise.all([
    prisma.rentalRequest.findMany({
      where,
      skip,
      take: limit,
      include: {
        tenant: {
          select: { id: true, name: true, email: true, phone: true },
        },
        property: {
          include: {
            landlord: {
              select: { id: true, name: true, email: true },
            },
            category: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rentalRequest.count({ where }),
  ]);

  return { rentals, meta: { page, limit, total } };
};

export const adminService = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentals,
  deletePropertyListing,
};
