import {
  ILearningPathEnrollment,
  LearningPathEnrollmentModel,
} from "../models/learningPathEnrollmentModel";
import { ILearningPathEnrollmentRepo } from "./interfaces/ILearningPathEnrollmentRepo";
import { GenericRepository } from "./genericRepository";
import mongoose, { FilterQuery, UpdateQuery } from "mongoose";
import { PopulateOptions } from "mongoose";

export class LearningPathEnrollmentRepo
  extends GenericRepository<ILearningPathEnrollment>
  implements ILearningPathEnrollmentRepo
{
  constructor() {
    super(LearningPathEnrollmentModel);
  }

  async createMany(
    enrollments: Partial<ILearningPathEnrollment>[],
  ): Promise<ILearningPathEnrollment[]> {
    // Validate that required fields are present
    enrollments.forEach((enrollment) => {
      if (!enrollment.userId || !enrollment.learningPathId) {
        throw new Error(
          "userId and learningPathId are required for all enrollments",
        );
      }
    });
    const docs = await this.model.insertMany(enrollments, { ordered: true });
    return docs as ILearningPathEnrollment[];
  }

  async createManyWithSession(
    enrollments: Partial<ILearningPathEnrollment>[],
    session: mongoose.ClientSession,
  ): Promise<ILearningPathEnrollment[]> {
    // Validate that required fields are present
    enrollments.forEach((enrollment) => {
      if (!enrollment.userId || !enrollment.learningPathId) {
        throw new Error(
          "userId and learningPathId are required for all enrollments",
        );
      }
    });
    const docs = await this.model.insertMany(enrollments, {
      session,
      ordered: true,
    });
    return docs as ILearningPathEnrollment[];
  }

  async findOneWithPopulate(
    filter: FilterQuery<ILearningPathEnrollment>,
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<ILearningPathEnrollment | null> {
    let query = this.model.findOne(filter);
    if (populate) query = query.populate(populate);
    return await query.exec();
  }

  async findByIdAndUpdateWithPopulate(
    id: string,
    data: UpdateQuery<ILearningPathEnrollment>,
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<ILearningPathEnrollment | null> {
    let query = this.model.findByIdAndUpdate(id, data, { new: true });
    if (populate) query = query.populate(populate);
    return await query.exec();
  }
}
