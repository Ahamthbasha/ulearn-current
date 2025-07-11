import { ChapterModel, CreateChapterDTO, IChapter } from "../../models/chapterModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorChapterRepository } from "../interfaces/IInstructorChapterRepository";

export class InstructorChapterRepository
  extends GenericRepository<IChapter>
  implements IInstructorChapterRepository
{
  constructor() {
    super(ChapterModel);
  }

  async createChapter(data: CreateChapterDTO): Promise<IChapter> {
    return await this.create(data); // using generic
  }

  async getChaptersByCourse(courseId: string): Promise<IChapter[]> {
    const chapters = await this.findAll({ courseId });
    return chapters || [];
  }

  async getChapterById(chapterId: string): Promise<IChapter | null> {
    return await this.findById(chapterId);
  }

  async updateChapter(chapterId: string, data: Partial<IChapter>): Promise<IChapter | null> {
    return await this.update(chapterId, data);
  }

  async deleteChapter(chapterId: string): Promise<IChapter | null> {
    return await this.delete(chapterId);
  }

  async findByTitleOrNumberAndCourseId(
  courseId: string,
  chapterTitle: string,
  chapterNumber: number
): Promise<IChapter | null> {
  return await this.findOne({
    courseId,
    $or: [
      { chapterTitle: { $regex: `^${chapterTitle}$`, $options: "i" } },
      { chapterNumber: chapterNumber }
    ]
  });
}

async paginateChapters(
  filter: object,
  page: number,
  limit: number
): Promise<{ data: IChapter[]; total: number }> {
  return this.paginate(filter, page, limit, { chapterNumber: 1 });
}

}
