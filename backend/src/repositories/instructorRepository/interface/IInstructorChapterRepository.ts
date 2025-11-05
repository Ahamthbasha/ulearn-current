import { CreateChapterDTO, IChapter } from "../../../models/chapterModel";

export interface IInstructorChapterRepository {
  createChapter(data: CreateChapterDTO): Promise<IChapter>;
  getChaptersByModule(moduleId: string): Promise<IChapter[]>; // Changed
  getChapterById(chapterId: string): Promise<IChapter | null>;
  updateChapter(
    chapterId: string,
    data: Partial<IChapter>
  ): Promise<IChapter | null>;
  deleteChapter(chapterId: string): Promise<IChapter | null>;

  findByTitleOrNumberAndModuleId( 
    moduleId: string,
    chapterTitle: string,
    chapterNumber: number,
    chapterId?: string
  ): Promise<IChapter | null>;

  reorderChapters(moduleId: string, orderedIds: string[]): Promise<void>

  paginateChapters(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: IChapter[]; total: number }>;
}