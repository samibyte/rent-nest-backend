import { PropertyStatus } from "../../../generated/prisma/enums.js";

export interface IPropertyPayload {
  title: string;
  description: string;
  address: string;
  city: string;
  area?: string;
  monthlyRent: number;
  securityDeposit?: number;
  bedrooms: number;
  bathrooms: number;
  size?: number;
  images: string[];
  amenities: string[];
  status?: PropertyStatus;
  categoryId: string;
}

export interface IPropertyFilters {
  searchTerm?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  amenities?: string[];
  bedrooms?: number;
  status?: PropertyStatus;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}