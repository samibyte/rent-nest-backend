import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { regionService } from "./region.service.js";

const getAllRegions = catchAsync(async (_req: Request, res: Response) => {
  const regions = await regionService.getAllRegions();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Regions fetched successfully",
    data: regions,
  });
});

export const regionController = { getAllRegions };
