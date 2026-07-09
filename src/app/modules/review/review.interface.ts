export interface ICreateReviewPayload {
  propertyId: string;
  rating: number;
  comment: string;
}

export interface IReviewFilters {
  propertyId?: string;
  tenantId?: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
}
