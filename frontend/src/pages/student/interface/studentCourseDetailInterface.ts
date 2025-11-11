export interface Quiz {
  quizId: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface Chapter {
  chapterId: string;
  chapterTitle: string;
  description: string;
  videoUrl: string;
  duration: string;
  position: number;
}

export interface Module {
  moduleId: string;
  moduleTitle: string;
  description: string;
  duration: string;
  position: number;
  chapters: Chapter[];
  chapterCount: number;
  quiz?: Quiz;
}

export interface CourseDetail {
  courseId: string;
  courseName: string;
  instructorName: string;
  instructorId: string;
  categoryName: string;
  thumbnailUrl: string;
  demoVideoUrl: string;
  description: string;
  level: string;
  price: number;
  originalPrice: number;
  discountedPrice?: number;
  duration: string;
  modules: Module[];
  chapterCount?: number;
  quizQuestionCount?: number;
}