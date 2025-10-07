import { ICourseOffer } from "../../../models/courseOfferModel";
import { CourseOfferListDTO, CourseOfferDetailDTO } from "../../../dto/instructorDTO/courseOfferDTO";

export interface IInstructorCourseOfferService {
  createCourseOffer(
    instructorId: string,
    courseId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date
  ): Promise<ICourseOffer>;

  editCourseOffer(
    instructorId: string,
    offerId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date
  ): Promise<ICourseOffer>;

  resubmitOffer(
    instructorId: string,
    offerId: string,
    discountPercentage: number,
    startDate: Date,
    endDate: Date
  ): Promise<ICourseOffer>;

  getOffersByInstructor(
    instructorId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{ data: CourseOfferListDTO[]; total: number }>;

  deleteCourseOffer(instructorId: string, offerId: string): Promise<void>;

  getInstructorCourseOfferById(offerId: string, instructorId: string): Promise<CourseOfferDetailDTO>;
}
