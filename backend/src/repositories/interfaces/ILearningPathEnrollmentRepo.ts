import { IGenericRepository } from "../genericRepository";
import { ILearningPathEnrollment } from "../../models/learningPathEnrollmentModel";
import mongoose from "mongoose";

export interface ILearningPathEnrollmentRepo
  extends IGenericRepository<ILearningPathEnrollment> {
  createMany(
    enrollments: Partial<ILearningPathEnrollment>[],
  ): Promise<ILearningPathEnrollment[]>;
  createManyWithSession(
    enrollments: Partial<ILearningPathEnrollment>[],
    session: mongoose.ClientSession,
  ): Promise<ILearningPathEnrollment[]>;
}
