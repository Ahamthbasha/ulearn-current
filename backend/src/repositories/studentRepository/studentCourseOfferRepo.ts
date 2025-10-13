import { ICourseOffer, CourseOfferModel } from "../../models/courseOfferModel";
import { GenericRepository } from "../genericRepository";
import { IStudentCourseOfferRepository } from "./interface/IStudentCourseOfferRepo"; 
import {Types} from "mongoose"
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

  async findValidOffersByCourseIds(courseIds: string[]): Promise<ICourseOffer[]> {
    const now = new Date();
    return await this.find({
      courseId: { $in: courseIds.map(id => new Types.ObjectId(id)) },
      isActive: true,
      status: "approved",
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  }
}