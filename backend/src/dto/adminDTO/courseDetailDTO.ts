export interface CourseDetailsDTO {
  courseId: string;
  courseName: string;
  instructorName?: string;
  categoryName?: string;
  description: string;
  durationFormat: string;
  price: number;
  level: string;
  thumbnailUrl: string;
  demoVideo: string;
  isPublished: boolean;
  isListed: boolean;
  isSubmitted: boolean;
  isVerified: boolean;
  modules: ModuleDetailsDTO[];
}

export interface ModuleDetailsDTO {
  moduleId: string;
  moduleTitle: string;
  position: number;
  moduleNumber?: number;
  description: string;
  durationFormat?: string;
  chaptersCount: number;
  quizCount: number;
  chapters?: ChapterDetailsDTO[];
  quiz?: QuizDetailsDTO | null;
}

export interface ChapterDetailsDTO {
  chapterId: string;
  chapterTitle: string;
  chapterNumber?: number;
  description: string;
  videoUrl: string;
  durationFormat: string;
}

export interface QuestionDTO {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizDetailsDTO {
  quizId: string;
  questions: QuestionDTO[];
}
