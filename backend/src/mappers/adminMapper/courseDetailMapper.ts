import { ICourse } from "../../models/courseModel";
import { IModule } from "../../models/moduleModel";
import { IChapter } from "../../models/chapterModel";
import { IQuiz, IQuestions } from "../../models/quizModel";
import {
  CourseDetailsDTO,
  ModuleDetailsDTO,
  ChapterDetailsDTO,
  QuizDetailsDTO,
  QuestionDTO,
} from "../../dto/adminDTO/courseDetailDTO";
import { formatDuration } from "../../utils/formatDuration";

export const mapCourseDetailsToDTO = (
  course: ICourse,
  modulesDetails: ModuleDetailsDTO[]
): CourseDetailsDTO => ({
  courseId: course._id.toString(),
  courseName: course.courseName,
  description: course.description,
  durationFormat:formatDuration(course.duration),
  price: course.price,
  level: course.level,
  thumbnailUrl: course.thumbnailUrl,
  demoVideo: course.demoVideo.url,
  isPublished: course.isPublished,
  isListed: course.isListed,
  isSubmitted: course.isSubmitted,
  isVerified: course.isVerified,
  modules: modulesDetails,
});

export const mapModuleToDTO = async (
  module: IModule,
  chapters: IChapter[],
  quiz: IQuiz | null
): Promise<ModuleDetailsDTO> => {
  const chaptersDTO: ChapterDetailsDTO[] = chapters.map((chapter) => ({
    chapterId: chapter._id.toString(),
    chapterTitle: chapter.chapterTitle,
    chapterNumber: chapter.chapterNumber,
    description: chapter.description,
    videoUrl: chapter.videoUrl,
    durationFormat: formatDuration(chapter.duration),
  }));

  const quizDTO = quiz ? mapQuizToDTO(quiz) : null;

  return {
    moduleId: module._id.toString(),
    moduleTitle: module.moduleTitle,
    position: module.position,
    moduleNumber: module.moduleNumber,
    description: module.description,
    durationFormat: formatDuration(module.duration ?? "0"),
    chaptersCount: chapters.length,
    quizCount: quiz ? quiz.questions.length : 0,
    chapters: chaptersDTO,
    quiz: quizDTO,
  };
};

export const mapQuizToDTO = (quiz: IQuiz): QuizDetailsDTO => {
  const questionsDTO: QuestionDTO[] = quiz.questions.map((question) => {
    const q = question as IQuestions;
    return {
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
    };
  });

  return {
    quizId: quiz._id.toString(),
    questions: questionsDTO,
  };
};
