export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer?: string;
}

export interface Quiz {
  id: string;
  questionsCount: number;
  questions: QuizQuestion[];
  isPassed?: boolean;
  scorePercentage?: number;
}

export interface Chapter {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  position: number;
  isCompleted: boolean;
}

export interface Module {
  id: string;
  title: string;
  duration: string;
  position: number;
  chapters: Chapter[];
  quiz: Quiz | null;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  thumbnail: string;
  demoVideo: string;
  totalLectures: number;
  totalQuizzes: number;
  modules: Module[];
}

export interface EnrollmentResponse {
  enrollmentId: string;
  completionPercentage: number;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  enrolledAt: string;
  certificate: { url: string } | null;
  course: Course;
}