import {
  ChapterModel,
  CreateChapterDTO,
  IChapter,
} from "../../models/chapterModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorChapterRepository } from "./interface/IInstructorChapterRepository";

export class InstructorChapterRepository
  extends GenericRepository<IChapter>
  implements IInstructorChapterRepository
{
  constructor() {
    super(ChapterModel);
  }

  async createChapter(data: CreateChapterDTO): Promise<IChapter> {
   const position = await this.getNextPosition({ moduleId: data.moduleId });
    const chapterData = {
      ...data,
      position,
      chapterNumber: position,
    };
    return this.create(chapterData);
  }

  async getChaptersByModule(moduleId: string): Promise<IChapter[]> {
    return await this.findAll(
      { moduleId },
      undefined,
      { chapterNumber: 1 }
    );
  }

  async getChapterById(chapterId: string): Promise<IChapter | null> {
    return await this.findById(chapterId);
  }

  async updateChapter(
    chapterId: string,
    data: Partial<IChapter>
  ): Promise<IChapter | null> {
    return await this.update(chapterId, data);
  }

  async deleteChapter(chapterId: string): Promise<IChapter | null> {
    const chapter = await this.findById(chapterId);
    if (!chapter) return null;

    const deleted = await this.model.findByIdAndDelete(chapterId);

    if (deleted) {
      await this.model.updateMany(
        {
          moduleId: chapter.moduleId,
          position: { $gt: chapter.position }
        },
        { $inc: { position: -1, chapterNumber: -1 } }
      );
    }

    return deleted;
  }

  async findByTitleOrNumberAndModuleId(
    moduleId: string,
    chapterTitle: string,
    chapterNumber: number,
    chapterId?: string
  ): Promise<IChapter | null> {
    return await this.findOne({
      moduleId, // Changed from courseId
      _id: { $ne: chapterId },
      $or: [
        { chapterTitle: { $regex: `^${chapterTitle}$`, $options: "i" } },
        { chapterNumber: chapterNumber },
      ],
    });
  }

  async paginateChapters(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: IChapter[]; total: number }> {
    return this.paginate(filter, page, limit, { chapterNumber: 1 });
  }

  async reorderChapters(moduleId: string, orderedIds: string[]): Promise<void> {
    const operations = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, moduleId },
        update: { position: index + 1, chapterNumber: index + 1 },
      },
    }));

    await this.model.bulkWrite(operations);
  }

  private async getNextPosition(filter: object): Promise<number> {
    const last = await this.model
      .findOne(filter)
      .sort({ position: -1 })
      .select("position")
      .lean();
    return (last?.position ?? 0) + 1;
  }
}