// import { CreateChapterDTO, IChapter } from "../../../models/chapterModel";
// import { ChapterDTO } from "../../../dto/instructorDTO/chapterDTO";

// export interface IInstructorChapterService {
//   createChapter(data: CreateChapterDTO): Promise<ChapterDTO>;
//   getChaptersByCourse(courseId: string): Promise<ChapterDTO[]>;
//   getChapterById(chapterId: string): Promise<IChapter | null>;
//   updateChapter(
//     chapterId: string,
//     data: Partial<IChapter>,
//   ): Promise<ChapterDTO | null>;
//   deleteChapter(chapterId: string): Promise<IChapter | null>;
//   findByTitleOrNumberAndCourseId(
//     courseId: string,
//     chapterTitle: string,
//     chapterNumber: number,
//     chapterId?: string,
//   ): Promise<IChapter | null>;
//   paginateChapters(
//     filter: object,
//     page: number,
//     limit: number,
//   ): Promise<{ data: ChapterDTO[]; total: number }>;
// }



import { CreateChapterDTO, IChapter } from "../../../models/chapterModel";
import { ChapterDTO } from "../../../dto/instructorDTO/chapterDTO";

export interface IInstructorChapterService {
  createChapter(data: CreateChapterDTO): Promise<ChapterDTO>;
  getChaptersByModule(moduleId: string): Promise<ChapterDTO[]>; // Changed
  getChapterById(chapterId: string): Promise<IChapter | null>;
  updateChapter(
    chapterId: string,
    data: Partial<IChapter>
  ): Promise<ChapterDTO | null>;
  deleteChapter(chapterId: string): Promise<IChapter | null>;
  findByTitleOrNumberAndModuleId( // Changed
    moduleId: string,
    chapterTitle: string,
    chapterNumber: number,
    chapterId?: string
  ): Promise<IChapter | null>;
  paginateChapters(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: ChapterDTO[]; total: number }>;
}