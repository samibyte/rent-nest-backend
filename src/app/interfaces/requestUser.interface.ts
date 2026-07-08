import { UserRole } from "../../generated/prisma/enums.js";

export interface IRequestUser {
  id: string;
  role: UserRole;
  email: string;
}
