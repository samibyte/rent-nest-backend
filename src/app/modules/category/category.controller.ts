import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { categoryService } from "./category.service.js";

const getAllCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories fetched successfully",
    data: categories,
  });
});

export const categoryController = { getAllCategories };
