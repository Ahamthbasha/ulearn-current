export interface CourseOfferListDTO {
  courseOfferId: string;
  courseId: string;
  courseName: string;
  discount: number;
  status: string;
  startDate: string;
  endDate: string;   
}

export interface CourseOfferDetailDTO {
  courseOfferId: string;
  courseId: string;
  courseName:string;
  courseOriginalPrice: number;
  discount: number;
  courseDiscountPrice: number;
  startDate: string;
  endDate: string;
  status: string;
  reviews: string;
}