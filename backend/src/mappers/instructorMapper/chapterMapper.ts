import { IChapter } from "../../models/chapterModel";
import { ChapterDTO } from "../../dto/instructorDTO/chapterDTO";
import { formatDuration } from "../../utils/formatDuration";

export function mapChapterToDTO(chapter: IChapter): ChapterDTO {
  return {
    moduleId: chapter.moduleId.toString(),
    chapterId: chapter._id.toString(),
    chapterTitle: chapter.chapterTitle,
    videoUrl: chapter.videoUrl,
    chapterNumber: chapter.chapterNumber,
    duration:chapter.duration || 0,
    durationFormatted:formatDuration(chapter.duration || 0)
  };
}

export function mapChaptersToDTO(chapters: IChapter[]): ChapterDTO[] {
  return chapters.map(mapChapterToDTO);
}
