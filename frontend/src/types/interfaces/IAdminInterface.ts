export interface CouponData {
  code: string;
  discount: number;
  expiryDate: string;
  minPurchase: number;
  maxDiscount: number;
}

export interface ICoupon {
  _id: string;
  code: string;
  discount: number;
  expiryDate: string;
  status: boolean;
  usedBy: string[];
  minPurchase: number;
  maxDiscount: number;
}

export interface ICourseOffer {
  _id: string;
  courseId: {
    _id: string;
    courseName: string;
    id?: string;
  };
  discountPercentage: number;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  discountedPrice?: number | null;
  id?: string;
}

export interface ICourseAdmin {
  courseId: string;
  courseName: string;
  isListed: boolean;
  isVerified: boolean;
  isPublished?: boolean;
  category?: string;
  instructorId?: string;
  offer?: string;
}