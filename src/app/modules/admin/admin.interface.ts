import { UserRole, UserStatus } from "../../../generated/prisma/enums.js";

export interface IUserFilters {
  searchTerm?: string;
  role?: UserRole;
  status?: UserStatus;
  email?: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}
