import { IChapterReadOnlyRepository } from "../interfaces/IChapterReadOnlyRepository";
import { ChapterModel, IChapter } from "../../models/chapterModel";
import { GenericRepository } from "../genericRepository";
import mongoose from "mongoose";

export class ChapterReadOnlyRepository
  extends GenericRepository<IChapter>
  implements IChapterReadOnlyRepository
{
  constructor() {
    super(ChapterModel);
  }

  async countChaptersByCourse(courseId: string): Promise<number> {
    return await this.countDocuments({
      courseId: new mongoose.Types.ObjectId(courseId),
    });
  }
}
