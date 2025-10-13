type ObjectId = string
export interface CouponData {
  code: string;
  discount: number;
  expiryDate: string;
  minPurchase: number;
  maxDiscount: number;
}

export interface adminCouponDto {
  couponId: string;
  code: string;
  discount: number;
  status: boolean;
  minPurchase: number;
  maxDiscount: number;
  expiryDate: string;
}

export interface IAdminCourseOffer {
  offerId: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  discount: number;
  status: "pending" | "approved" | "rejected";
}

export interface IAdminCourseOfferDetail{
  courseOfferId: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  discount: number;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  review: string;
  coursePrice:number;
  discountedPrice:number;
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
  instructorEmail?:string;
  items: LearningPathItemDTO[];
  totalPrice:number;
  isPublished: boolean;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "pending" | "accepted" | "rejected"; 
  adminReview?: string;
  thumbnailUrl?:string;
  categoryId:string;
  categoryName:string
}

export interface LearningPathSummaryDTO {
  learningPathId: string;
  title: string;
  instructorName?: string;
  status: "pending" | "accepted" | "rejected" | "draft";
  TotalCourseInLearningPath: number;
  unverifiedCourseInLearningPath: number;
}