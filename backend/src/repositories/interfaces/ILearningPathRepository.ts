import { ClientSession } from "mongoose";
import { IGenericRepository } from "../genericRepository";
import { ILearningPath } from "../../models/learningPathModel";

export interface ILearningPathRepository extends IGenericRepository<ILearningPath> {
  findAll(filter: object, populate?: any[]): Promise<ILearningPath[]>;
  findAllWithSession(filter: object, session: ClientSession, populate?: any[]): Promise<ILearningPath[]>;
}