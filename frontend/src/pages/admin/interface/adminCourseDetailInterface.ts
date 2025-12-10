
export interface Module {
  moduleId: string;
  moduleTitle: string;
  position: number;
  moduleNumber?: number;
  description: string;
  durationFormat: string;
  chaptersCount: number;
  quizCount: number;
  chapters?: Chapter[];
  quiz?: Quiz | null;
}

export interface Chapter {
  chapterId: string;
  chapterTitle: string;
  chapterNumber?: number;
  description: string;
  videoUrl: string;
  durationFormat: string;
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  quizId: string;
  questions: Question[];
}

export interface CourseDetailsResponse {
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
  modules: Module[];
}
