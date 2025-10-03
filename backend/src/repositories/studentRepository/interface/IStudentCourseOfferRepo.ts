import { ICourseOffer } from "../../../models/courseOfferModel";

export interface IStudentCourseOfferRepository {
  findValidOfferByCourseId(courseId: string): Promise<ICourseOffer | null>;
}