import { ClientSession } from "mongoose";
import { ILearningPath, LearningPathModel } from "../models/learningPathModel";
import { ILearningPathRepository } from "./interfaces/ILearningPathRepository";
import { GenericRepository } from "./genericRepository";

export class LearningPathRepo
  extends GenericRepository<ILearningPath>
  implements ILearningPathRepository
{
  constructor() {
    super(LearningPathModel);
  }

  async findAll(filter: object, populate?: any[]): Promise<ILearningPath[]> {
    let query = LearningPathModel.find(filter);
    if (populate) {
      query = query.populate(populate);
    }
    return query.exec();
  }

  async findAllWithSession(
    filter: object,
    session: ClientSession,
    populate?: any[],
  ): Promise<ILearningPath[]> {
    let query = LearningPathModel.find(filter).session(session);
    if (populate) {
      query = query.populate(populate);
    }
    return query.exec();
  }
}
