import { CreateChapterDTO, IChapter } from "../../models/chapterModel";
import { ChapterDTO } from "../../dto/instructorDTO/chapterDTO";
import { IInstructorChapterRepository } from "../../repositories/instructorRepository/interface/IInstructorChapterRepository";
import { IInstructorChapterService } from "./interface/IInstructorChapterService";
import {
  mapChapterToDTO,
  mapChaptersToDTO,
} from "../../mappers/instructorMapper/chapterMapper";

export class InstructorChapterService implements IInstructorChapterService {
  private _chapterRepo: IInstructorChapterRepository;

  constructor(chapterRepo: IInstructorChapterRepository) {
    this._chapterRepo = chapterRepo;
  }

  async createChapter(data: CreateChapterDTO): Promise<ChapterDTO> {
    const chapter = await this._chapterRepo.createChapter(data);
    return mapChapterToDTO(chapter);
  }

  async getChaptersByModule(moduleId: string): Promise<ChapterDTO[]> {
    const chapters = await this._chapterRepo.getChaptersByModule(moduleId); // Changed
    return mapChaptersToDTO(chapters);
  }

  async getChapterById(chapterId: string): Promise<IChapter | null> {
    return this._chapterRepo.getChapterById(chapterId);
  }

  async updateChapter(
    chapterId: string,
    data: Partial<IChapter>
  ): Promise<ChapterDTO | null> {
    const updatedChapter = await this._chapterRepo.updateChapter(
      chapterId,
      data
    );
    if (!updatedChapter) return null;
    return mapChapterToDTO(updatedChapter);
  }

  async deleteChapter(chapterId: string): Promise<IChapter | null> {
    return this._chapterRepo.deleteChapter(chapterId);
  }

  async findByTitleOrNumberAndModuleId(
    moduleId: string,
    chapterTitle: string,
    chapterNumber: number,
    chapterId?: string
  ): Promise<IChapter | null> {
    return this._chapterRepo.findByTitleOrNumberAndModuleId(
      moduleId, // Changed
      chapterTitle,
      chapterNumber,
      chapterId
    );
  }

  async paginateChapters(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: ChapterDTO[]; total: number }> {
    const result = await this._chapterRepo.paginateChapters(
      filter,
      page,
      limit
    );
    return {
      data: mapChaptersToDTO(result.data),
      total: result.total,
    };
  }

  async reorderChapters(moduleId: string, orderedIds: string[]): Promise<{
    data: ChapterDTO[];
    total: number;
  }> {
    await this._chapterRepo.reorderChapters(moduleId, orderedIds);
    const chapters = await this._chapterRepo.getChaptersByModule(moduleId);
    return {
      data: mapChaptersToDTO(chapters),
      total: chapters.length,
    };
  }
}