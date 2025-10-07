type ObjectId = string
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
    name?: string;  // In case your backend returns 'name' or 'courseName'
    id?: string;
  };
  instructorId: {
    _id: string;
    name: string;
    email?: string;
  };
  discountPercentage: number;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  reviews?: string;
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

export interface ICategoryModel {
  _id: ObjectId;
  categoryName: string;
  description?: string;
  isListed: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export interface ICategoryOffer {
  _id: ObjectId;
  categoryId: { _id: ObjectId; categoryName: string };
  discountPercentage: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  isActive: boolean;
  courseOffers: ObjectId[]; // Array of ICourseOffer _id values
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}


export interface LearningPathItemDTO {
  courseId: string;
  order: number;
  courseName?: string;
  thumbnailUrl?: string;
  price?:number;
  isVerified?:boolean
}

export interface LearningPathDTO {
  _id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName?:string;
  items: LearningPathItemDTO[];
  totalAmount:number;
  isPublished: boolean;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "pending" | "accepted" | "rejected"; 
  adminReview?: string;
}

export interface LearningPathSummaryDTO {
  learningPathId: string;
  title: string;
  instructorName?: string;
  status: "pending" | "accepted" | "rejected" | "draft";
  LearningPathCourse: number;
  UnverifiedCourses: number;
}