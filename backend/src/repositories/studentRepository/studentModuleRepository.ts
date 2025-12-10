import { IStudentModuleRepository } from "./interface/IStudentModuleRepository";
import { IModule, ModuleModel, IModulePopulated } from "../../models/moduleModel";
import { IChapter } from "../../models/chapterModel";
import {
  IModuleDTO,
  IChapterDTO,
  IQuizDTO,
} from "../../dto/userDTO/courseDetailDTO";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { formatDuration } from "../../utils/formatDuration";
import { GenericRepository } from "../genericRepository";

export class StudentModuleRepository
  extends GenericRepository<IModule>
  implements IStudentModuleRepository
{
  constructor() {
    super(ModuleModel);
  }

  async getModulesByCourseId(courseId: string): Promise<IModuleDTO[]> {
    const modules = (await this.find(
      { courseId },
      [
        {
          path: "chapters",
          select: "chapterTitle description videoUrl duration position",
          options: { sort: { position: 1 } },
        },
        {
          path: "quiz",
          select: "questions",
        },
      ],
      { position: 1 }
    )) as IModulePopulated[];

    const result: IModuleDTO[] = [];

    for (const mod of modules) {
      // Build chapters DTO & get presigned URLs + format durations for chapters
      const chaptersDTO: IChapterDTO[] = await Promise.all(
        (mod.chapters ?? []).map(async (ch: IChapter) => ({
          chapterId: ch._id.toString(),
          chapterTitle: ch.chapterTitle,
          description: ch.description,
          videoUrl: await getPresignedUrl(ch.videoUrl),
          duration: formatDuration(ch.duration ?? 0), // e.g. "2h 15m"
          position: ch.position ?? 0,
        }))
      );

      // Count of chapters in module
      const chapterCount = chaptersDTO.length;

      // Module duration is sum of raw chapter durations (seconds), format once
      const totalSeconds = mod.chapters?.reduce(
        (sum, ch) => sum + (ch.duration ?? 0),
        0
      ) ?? 0;

      // Build quiz DTO if exists
      let quizDTO: IQuizDTO | undefined;
      if (mod.quiz) {
        quizDTO = {
          quizId: mod.quiz._id.toString(),
          questions: mod.quiz.questions.map((q) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
        };
      }

      result.push({
        moduleId: mod._id.toString(),
        moduleTitle: mod.moduleTitle,
        description: mod.description,
        duration: formatDuration(totalSeconds), // format total module duration string

        position: mod.position ?? 0,
        chapters: chaptersDTO,
        chapterCount:chapterCount,
        quiz: quizDTO,

      });
    }

    return result;
  }
}
