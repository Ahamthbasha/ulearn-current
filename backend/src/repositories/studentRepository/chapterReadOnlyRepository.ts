import { IChapterReadOnlyRepository } from "../interfaces/IChapterReadOnlyRepository";
import { ChapterModel } from "../../models/chapterModel";
import mongoose from "mongoose";

export class ChapterReadOnlyRepository implements IChapterReadOnlyRepository {
  async countChaptersByCourse(courseId: string): Promise<number> {
    return await ChapterModel.countDocuments({ courseId: new mongoose.Types.ObjectId(courseId) });
  }
}
