// dto/adminDTO/courseDetailsDTO.ts

export interface CourseDetailsDTO {
  courseId: string;
  courseName: string;
  isPublished: boolean;
  isVerified: boolean;
  isListed: boolean;
  isSubmitted: boolean;
  review: string;
  thumbnailUrl: string;
  demoVideo: string;
  price: number;
  duration: string;
  level: string;
  description: string;
}

export interface ChapterDetailsDTO {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  chapterNumber?: number;
  videoUrl: string;
}

export interface QuestionDTO {
  questionId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizDetailsDTO {
  quizId: string;
  questions: QuestionDTO[];
}

export interface CourseDetailsResponseDTO {
  course: CourseDetailsDTO;
  chapters: ChapterDetailsDTO[];
  quiz: QuizDetailsDTO | null;
}
