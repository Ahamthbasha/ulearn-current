// src/dto/userDTO/courseViewingDTO.ts
export interface ChapterViewingDTO {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  position: number;
  isCompleted: boolean;
}

export interface QuizQuestionDTO {
  questionText: string;
  options: string[];
  correctAnswer?: string; // optional: hide from frontend if needed
}

export interface ModuleViewingDTO {
  id: string;
  title: string;
  duration: string;
  position: number;
  chapters: ChapterViewingDTO[];
  quiz: {
    id: string;
    questionsCount: number;
    questions: QuizQuestionDTO[];
    isPassed?: boolean;
    scorePercentage?: number;
  } | null;
}
export interface CourseViewingDTO {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  thumbnail: string;
  demoVideo: string;
  totalLectures: number;
  totalQuizzes: number;
  modules: ModuleViewingDTO[];
}

export interface CourseViewingResponseDTO {
  enrollmentId: string;
  completionPercentage: number;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  enrolledAt: string;
  certificate: { url: string } | null;
  course: CourseViewingDTO;
}