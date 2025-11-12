import { IGenericRepository } from "../genericRepository";
import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
import mongoose, { FilterQuery, PopulateOptions, UpdateQuery } from "mongoose";

export interface ILearningPathEnrollmentRepo
  extends IGenericRepository<ILearningPathEnrollment> {
  createMany(
    enrollments: Partial<ILearningPathEnrollment>[],
  ): Promise<ILearningPathEnrollment[]>;
  createManyWithSession(
    enrollments: Partial<ILearningPathEnrollment>[],
    session: mongoose.ClientSession,
  ): Promise<ILearningPathEnrollment[]>;


  findOneWithPopulate(
    filter: FilterQuery<ILearningPathEnrollment>,
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<ILearningPathEnrollment | null>;

  findByIdAndUpdateWithPopulate(
    id: string,
    data: UpdateQuery<ILearningPathEnrollment>,
    populate?: PopulateOptions | PopulateOptions[],
  ): Promise<ILearningPathEnrollment | null>;
}
