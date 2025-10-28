import { ICourse } from "../../models/courseModel";
import { IChapter } from "../../models/chapterModel";
import { IQuiz, IQuestions } from "../../models/quizModel";
import {
  CourseDetailsDTO,
  ChapterDetailsDTO,
  QuizDetailsDTO,
  QuestionDTO,
  CourseDetailsResponseDTO,
} from "../../dto/adminDTO/courseDetailDTO";

export const mapCourseDetailsToDTO = (course: ICourse): CourseDetailsDTO => {
  return {
    courseId: course._id.toString(),
    courseName: course.courseName,
    isPublished: course.isPublished,
    isVerified: course.isVerified,
    isListed: course.isListed,
    isSubmitted: course.isSubmitted,
    review: course.review || "",
    thumbnailUrl: course.thumbnailUrl,
    demoVideo: course.demoVideo.url,
    price: course.price,
    duration: course.duration,
    level: course.level,
    description: course.description,
  };
};

export const mapChaptersToDTO = (chapters: IChapter[]): ChapterDetailsDTO[] => {
  return chapters.map((chapter) => ({
    chapterId: chapter._id.toString(),
    chapterTitle: chapter.chapterTitle,
    chapterDescription: chapter.description,
    chapterNumber: chapter.chapterNumber,
    videoUrl: chapter.videoUrl,
  }));
};

export const mapQuestionsToDTO = (questions: IQuestions[]): QuestionDTO[] => {
  return questions.map((question) => ({
    questionId: question._id?.toString() || "",
    questionText: question.questionText,
    options: question.options,
    correctAnswer: question.correctAnswer,
  }));
};

export const mapQuizToDTO = (quiz: IQuiz | null): QuizDetailsDTO | null => {
  if (!quiz) return null;

  return {
    quizId: quiz._id.toString(),
    questions: mapQuestionsToDTO(quiz.questions.toObject() as IQuestions[]),
  };
};

export const mapCourseDetailsResponseToDTO = (
  course: ICourse,
  chapters: IChapter[],
  quiz: IQuiz | null,
): CourseDetailsResponseDTO => {
  return {
    course: mapCourseDetailsToDTO(course),
    chapters: mapChaptersToDTO(chapters),
    quiz: mapQuizToDTO(quiz),
  };
};
