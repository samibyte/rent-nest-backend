import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "../../generated/prisma/enums.js";
import { envVars } from "../config/env.js";
import { catchAsync } from "../shared/catchAsync.js";
import { jwtUtils } from "../utils/jwt.js";
import { prisma } from "../lib/prisma.js";
import { NextFunction, Request, Response } from "express";
import AppError from "../errorHelpers/AppError.js";
import httpStatus from "http-status";

export const auth = (...authRoles: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization?.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not logged in. Please log in to access this resource.",
      );
    }

    const verifiedToken = jwtUtils.verifyToken(
      token,
      envVars.ACCESS_TOKEN_SECRET,
    );

    if (!verifiedToken.success) {
      throw new Error(verifiedToken.error);
    }

    const { email, name, id, role } = verifiedToken.data as JwtPayload;

    if (authRoles.length && !authRoles.includes(role)) {
      throw new Error(
        "Forbidden. You don't have permission to access this resource.",
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
        email,
        name,
        role,
      },
    });

    if (!user) {
      throw new Error("User not found. Please log in again.");
    }

    if (user.status === "BANNED") {
      throw new Error("Your account has been blocked. Please contact support.");
    }

    req.user = {
      email,
      name,
      id,
      role,
    };

    next();
  });
};
