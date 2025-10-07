import { CourseOfferModel, ICourseOffer } from "../../models/courseOfferModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorCourseOfferRepo } from "./interface/IInstructorCourseofferRepo"; 

export class InstructorCourseOfferRepo extends GenericRepository<ICourseOffer> implements IInstructorCourseOfferRepo {
  constructor() {
    super(CourseOfferModel);
  }

  async findById(offerId: string): Promise<ICourseOffer | null> {
    return this.model.findById(offerId).populate("courseId", "courseName price").exec();
  }

  async createOffer(data: Partial<ICourseOffer>): Promise<ICourseOffer> {
    return new this.model(data).save();
  }

  async updateById(offerId: string, data: Partial<ICourseOffer>): Promise<ICourseOffer | null> {
    return this.model.findByIdAndUpdate(offerId, data, { new: true }).exec();
  }

  async deleteById(offerId: string, instructorId: string): Promise<ICourseOffer | null> {
    return this.model.findOneAndDelete({ _id: offerId, instructorId }).exec();
  }

  async getOffersByInstructor(instructorId: string, page: number, limit: number, search?: string): Promise<{ data: ICourseOffer[]; total: number }> {
    const query: any = { instructorId };
    if (search && search.trim() !== "") query['$text'] = { $search: search };
    const total = await this.model.countDocuments(query);
    const data = await this.model.find(query)
      .skip((page - 1) * limit).limit(limit)
      .populate("courseId", "courseName price")
      .sort({ createdAt: -1 }).exec();
    return { data, total };
  }
}
