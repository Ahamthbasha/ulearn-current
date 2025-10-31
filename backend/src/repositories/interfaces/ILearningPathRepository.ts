import { ClientSession, PopulateOptions } from "mongoose";
import { IGenericRepository } from "../genericRepository";
import { ILearningPath } from "../../models/learningPathModel";

export interface ILearningPathRepository
  extends IGenericRepository<ILearningPath> {
  findAll(filter: object, populate?: PopulateOptions[]): Promise<ILearningPath[]>;
  findAllWithSession(
    filter: object,
    session: ClientSession,
    populate?: PopulateOptions[],
  ): Promise<ILearningPath[]>;
}
