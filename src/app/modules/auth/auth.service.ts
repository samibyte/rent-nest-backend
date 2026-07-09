import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { ILoginUser, IRegisterUserPayload } from "./auth.interface.js";
import { envVars } from "../../config/env.js";
import { UserRole, UserStatus } from "../../../generated/prisma/enums.js";
import { tokenUtils } from "../../utils/token.js";
import AppError from "../../errorHelpers/AppError.js";
import status from "http-status";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";

const registerUser = async (payload: IRegisterUserPayload) => {
  const { name, email, password, phone, avatar, role } = payload;

  if (role !== UserRole.TENANT && role !== UserRole.LANDLORD) {
    throw new AppError(status.BAD_REQUEST, "Invalid role. Only TENANT or LANDLORD can register.");
  }

  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    throw new AppError(status.BAD_REQUEST, "User already exists.");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(envVars.BCRYPT_SALT_ROUNDS),
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      avatar,
      role,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
      email: createdUser.email || email,
    },
    omit: {
      password: true,
    },
  });

  return user;
};

const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  if (user.status === UserStatus.BANNED) {
    throw new AppError(
      status.FORBIDDEN,
      "Your account has been banned. Please contact support.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);


  if (!isPasswordMatched) {
    throw new AppError(status.UNAUTHORIZED, "Invalid email or password.");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = tokenUtils.getAccessToken(jwtPayload);

  const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (user: IRequestUser) => {
  const userExists = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    omit: {
      password: true,
    },
  });

  if (!userExists) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return userExists;
};

export const authService = {
  registerUser,
  loginUser,
  getMe,
};
