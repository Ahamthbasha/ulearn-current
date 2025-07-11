import { CreateChapterDTO, IChapter } from "../../models/chapterModel";

export interface IInstructorChapterRepository {
  createChapter(data: CreateChapterDTO): Promise<IChapter>;
  getChaptersByCourse(courseId: string): Promise<IChapter[]>;
  getChapterById(chapterId: string): Promise<IChapter | null>;
  updateChapter(chapterId: string, data: Partial<IChapter>): Promise<IChapter | null>;
  deleteChapter(chapterId: string): Promise<IChapter | null>;

  findByTitleOrNumberAndCourseId(courseId: string,chapterTitle: string,chapterNumber: number): Promise<IChapter | null>;

  paginateChapters(
  filter: object,
  page: number,
  limit: number
): Promise<{ data: IChapter[]; total: number }>;

}
