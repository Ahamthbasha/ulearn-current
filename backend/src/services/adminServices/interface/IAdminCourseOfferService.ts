import { ICourse } from "../../../models/courseModel"; 
import { ICourseOffer } from "../../../models/courseOfferModel";

export interface IAdminCourseOfferService {
  getPublishedCourses(): Promise<ICourse[]>;

  createCourseOffer(
    courseId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ICourseOffer>;

  editCourseOffer(
    offerId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ICourseOffer>;

  toggleCourseOfferActive(offerId: string): Promise<ICourseOffer>;

  deleteCourseOffer(offerId: string): Promise<void>;

  getCourseOffers(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ICourseOffer[]; total: number }>;

  getCourseOfferById(offerId: string): Promise<ICourseOffer | null>
}