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

export type PropertySortBy = "monthlyRent" | "createdAt" | "bedrooms";
export type SortOrder = "asc" | "desc";

export type AmenityMatch = "all" | "any";

export interface IPropertyFilters {
  searchTerm?: string;
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  amenities?: string[];
  amenityMatch?: AmenityMatch; // "all" = hasEvery (default) | "any" = hasSome
  bedrooms?: number;           // exact match (kept for backward compat)
  minBedrooms?: number;        // range lower bound
  maxBedrooms?: number;        // range upper bound
  bathrooms?: number;          // exact match
  status?: PropertyStatus;
  sortBy?: PropertySortBy;
  sortOrder?: SortOrder;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}