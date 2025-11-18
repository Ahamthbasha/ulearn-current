import { IEnrollment } from "../../models/enrollmentModel";
import { ICourseFullyPopulated } from "../../models/courseModel";
import {
  CourseViewingResponseDTO,
  ModuleViewingDTO,
  ChapterViewingDTO,
  CourseViewingDTO,
} from "../../dto/userDTO/courseViewingDTO";
import { formatDuration } from "../../utils/formatDuration";

export const mapToCourseViewingResponse = async (
  enrollment: IEnrollment & { courseId: ICourseFullyPopulated },
  getPresignedUrl: (url: string) => Promise<string>
): Promise<CourseViewingResponseDTO> => {
  const course = enrollment.courseId;
  const [thumbnail, demoVideo] = await Promise.all([
    course.thumbnailUrl ? getPresignedUrl(course.thumbnailUrl) : Promise.resolve(""),
    course.demoVideo?.url ? getPresignedUrl(course.demoVideo.url) : Promise.resolve(""),
  ]);

  const modules: ModuleViewingDTO[] = [];
  let totalCourseSeconds = 0;
  let totalLectures = 0;
  let totalQuizzes = 0;

  for (const module of course.modules || []) {
    let moduleSeconds = 0;
    const chapters: ChapterViewingDTO[] = [];

    for (const chapter of module.chapters || []) {
      const videoUrl = chapter.videoUrl ? await getPresignedUrl(chapter.videoUrl) : "";
      const chapterSeconds = chapter.duration ?? 0;
      moduleSeconds += chapterSeconds;
      totalCourseSeconds += chapterSeconds;
      totalLectures++;

      const isCompleted = enrollment.completedChapters.some(
        (c) => c.chapterId.toString() === chapter._id.toString() && c.isCompleted
      );

      chapters.push({
        id: chapter._id.toString(),
        title: chapter.chapterTitle,
        duration: formatDuration(chapterSeconds),
        videoUrl,
        position: chapter.position,
        isCompleted,
      });
    }

let quizDto: ModuleViewingDTO["quiz"] = null;

if (module.quiz) {
  totalQuizzes++;

  const quizResult = enrollment.completedQuizzes.find(
    (q) => q.quizId.toString() === module.quiz!._id.toString()
  );

  quizDto = {
    id: module.quiz._id.toString(),
    questionsCount: module.quiz.questions.length,
    questions: module.quiz.questions.map(q => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
    isPassed: quizResult?.isPassed,
    scorePercentage: quizResult?.scorePercentage,
  };
}

    modules.push({
      id: module._id.toString(),
      title: module.moduleTitle,
      duration: formatDuration(moduleSeconds),
      position: module.position,
      chapters,
      quiz: quizDto,
    });
  }

  const courseDto: CourseViewingDTO = {
    id: course._id.toString(),
    title: course.courseName,
    description: course.description,
    level: course.level,
    duration: formatDuration(totalCourseSeconds),
    thumbnail,
    demoVideo,
    totalLectures,
    totalQuizzes,
    modules,
  };

  let certificateUrl: string | null = null;
  if (enrollment.certificateGenerated && enrollment.certificateUrl) {
    certificateUrl = await getPresignedUrl(enrollment.certificateUrl);
  }

  return {
    enrollmentId: enrollment._id.toString(),
    completionPercentage: enrollment.completionPercentage,
    completionStatus: enrollment.completionStatus,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    certificate: certificateUrl ? { url: certificateUrl } : null,
    course: courseDto,
  };
};