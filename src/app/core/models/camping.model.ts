export interface Camping {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  province: string;
  country: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

export interface CampingFilter {
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
