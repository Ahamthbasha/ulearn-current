import { ICourse, CourseModel } from "../models/courseModel";

import { GenericRepository } from "./genericRepository";

export class CourseRepository extends GenericRepository<ICourse> {
  constructor() {
    super(CourseModel);
  }

  async removeOffer(courseId: string): Promise<ICourse | null> {
    return await this.model
      .findByIdAndUpdate(courseId, { $unset: { offer: 1 } }, { new: true })
      .exec();
  }
}
