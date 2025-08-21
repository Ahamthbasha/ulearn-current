import { IChapter } from "../../models/chapterModel";
import { ChapterDTO } from "../../dto/instructorDTO/chapterDTO";

export function mapChapterToDTO(chapter: IChapter): ChapterDTO {
  return {
    courseId: chapter.courseId.toString(),
    chapterId: chapter._id.toString(),
    chapterTitle: chapter.chapterTitle,
    videoUrl: chapter.videoUrl,
    chapterNumber: chapter.chapterNumber,
  };
}

export function mapChaptersToDTO(chapters: IChapter[]): ChapterDTO[] {
  return chapters.map(mapChapterToDTO);
}
