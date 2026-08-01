import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { authService } from "./auth.service.js";
import { sendResponse } from "../../shared/sendResponse.js";
import httpStatus from "http-status";
import { tokenUtils } from "../../utils/token.js";

const registerUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const user = await authService.registerUser(payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User registered successfully",
      data: { user },
    });
  },
);

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const result = await authService.loginUser(payload);
    const { accessToken, refreshToken, ...rest } = result;

    tokenUtils.setAccessTokenCookie(res, accessToken);
    tokenUtils.setRefreshTokenCookie(res, refreshToken);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User logged in successfully",
      data: {
        accessToken,
        refreshToken,
        ...rest,
      },
    });
  },
);

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    const result = await authService.getMe(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User fetched successfully",
      data: result,
    });
  },
);

export const authController = {
  registerUser,
  loginUser,
  getMe,
};
