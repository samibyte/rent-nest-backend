import { Router } from "express";
import { auth } from "../../middlewares/checkAuth.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { multerUpload } from "../../config/multer.config.js";
import { uploadController } from "./upload.controller.js";

export const uploadRouter: Router = Router();

// POST /api/v1/upload/image  — upload a local image file to Cloudinary
// multer-storage-cloudinary handles the actual upload; req.file.path = secure_url
uploadRouter.post(
  "/image",
  multerUpload.single("file"),
  uploadController.uploadFile,
);

// POST /api/v1/upload/image-url  — accept and validate an external image URL
uploadRouter.post(
  "/image-url",
  auth(UserRole.ADMIN, UserRole.LANDLORD, UserRole.TENANT),
  uploadController.passUrl,
);
