import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import AppError from "../../errorHelpers/AppError.js";

/**
 * POST /api/v1/upload/image
 * Receives a multipart/form-data request with a single `file` field.
 * multer-storage-cloudinary has already uploaded it; `req.file.path` is the Cloudinary URL.
 */
const uploadFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, "No file was provided.");
  }

  const file = req.file as Express.Multer.File & { path: string; filename: string };

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Image uploaded successfully",
    data: {
      url: file.path,         // Cloudinary secure_url
      publicId: file.filename, // Cloudinary public_id set by multer-storage-cloudinary
    },
  });
});

/**
 * POST /api/v1/upload/image-url
 * Receives { url: string } and passes it through after basic validation.
 * Avoids a Cloudinary round-trip for URLs already hosted on a CDN.
 */
const passUrl = catchAsync(async (req: Request, res: Response) => {
  const { url } = req.body as { url: string };

  if (!url || typeof url !== "string") {
    throw new AppError(httpStatus.BAD_REQUEST, "A valid 'url' string is required.");
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    throw new AppError(httpStatus.BAD_REQUEST, "The provided URL is not valid.");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Image URL accepted",
    data: { url },
  });
});

export const uploadController = { uploadFile, passUrl };
