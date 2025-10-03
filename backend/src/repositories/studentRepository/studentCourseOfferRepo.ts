import { ICourseOffer, CourseOfferModel } from "../../models/courseOfferModel";
import { GenericRepository } from "../genericRepository";
import { IStudentCourseOfferRepository } from "./interface/IStudentCourseOfferRepo"; 

export class StudentCourseOfferRepository
  extends GenericRepository<ICourseOffer>
  implements IStudentCourseOfferRepository
{
  constructor() {
    super(CourseOfferModel);
  }

  async findValidOfferByCourseId(courseId: string): Promise<ICourseOffer | null> {
    const now = new Date(); 
    return this.findOne({
      courseId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  }
}