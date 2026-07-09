import { RentalStatus } from "../../../generated/prisma/enums.js";

export interface ICreateRentalPayload {
  propertyId: string;
  moveInDate: Date;
  message?: string;
}

export interface ILandlordUpdateStatusPayload {
  status: Extract<RentalStatus, "APPROVED" | "REJECTED">;
}

export interface IRentalFilters {
  status?: RentalStatus;
  propertyId?: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}
