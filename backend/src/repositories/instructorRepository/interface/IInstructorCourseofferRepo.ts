import { ICourseOffer } from "../../../models/courseOfferModel";
import { IGenericRepository } from "../../../repositories/genericRepository";

export interface IInstructorCourseOfferRepo
  extends IGenericRepository<ICourseOffer> {
  findById(offerId: string): Promise<ICourseOffer | null>;
  createOffer(data: Partial<ICourseOffer>): Promise<ICourseOffer>;
  updateById(
    offerId: string,
    data: Partial<ICourseOffer>,
  ): Promise<ICourseOffer | null>;
  deleteById(
    offerId: string,
    instructorId: string,
  ): Promise<ICourseOffer | null>;
  getOffersByInstructor(
    instructorId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
  ): Promise<{ data: ICourseOffer[]; total: number }>;
  getActiveOfferByCourseId(courseId: string): Promise<ICourseOffer | null>;
}
