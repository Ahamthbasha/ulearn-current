import { ClientSession, PopulateOptions } from "mongoose";
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

  async findAll(filter: object, populate?: PopulateOptions[]): Promise<ILearningPath[]> {
    let query = LearningPathModel.find(filter);
    if (populate?.length) query = query.populate(populate);
    return query.exec();
  }

  async findAllWithSession(
    filter: object,
    session: ClientSession,
    populate?: PopulateOptions[],
  ): Promise<ILearningPath[]> {
    let query = LearningPathModel.find(filter).session(session);
    if (populate?.length) query = query.populate(populate);
    return query.exec();
  }

  async findByIdPopulated(
    id: string,
    populate: PopulateOptions[],
  ): Promise<ILearningPath | null> {
    let query = this.model.findById(id);
    if (populate.length) query = query.populate(populate);
    return query.exec(); // returns hydrated ILearningPath
  }
}