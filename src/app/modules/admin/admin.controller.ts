import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { adminService } from "./admin.service.js";
import { UserRole, UserStatus } from "../../../generated/prisma/enums.js";

// Admin: Get Dashboard Stats

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard statistics retrieved successfully",
    data: stats,
  });
});

// Admin: Get All Users

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, searchTerm, role, status, email } = req.query;

  const result = await adminService.getAllUsers(
    {
      searchTerm: searchTerm as string | undefined,
      role: role as UserRole | undefined,
      status: status as UserStatus | undefined,
      email: email as string | undefined,
    },
    {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    },
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users list retrieved successfully",
    data: result.users,
    meta: result.meta,
  });
});

// Admin: Update User Status

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const user = await adminService.updateUserStatus(id as string, status);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User status updated successfully",
    data: user,
  });
});

// Admin: Delete Property Listing

const deletePropertyListing = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await adminService.deletePropertyListing(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Property listing moderated and deleted successfully",
    data: null,
  });
});

export const adminController = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deletePropertyListing,
};
