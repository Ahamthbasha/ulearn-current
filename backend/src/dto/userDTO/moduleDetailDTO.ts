// src/dto/userDTO/moduleDetailDTO.ts
export interface IChapterDTO {
  chapterId: string;
  chapterTitle: string;
  description: string;
  videoUrl: string;
  duration: string;               // formatted “2h 15m”
  position: number;
}

export interface IQuizDTO {
  quizId: string;
  questionCount: number;
}

export interface IModuleDTO {
  moduleId: string;
  moduleTitle: string;
  description: string;
  duration: string;               // sum of all chapter durations
  position: number;
  chapters: IChapterDTO[];
  quiz?: IQuizDTO;
}