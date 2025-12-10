export interface IQuestion {
  _id?:string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  quizId?:string;
}

export interface IQuizPayload {
    _id: string;
  courseId: string;
  questions: IQuestion[];
}

export interface ICreateQuizPayload {
  courseId: string;
  questions: IQuestion[];
}

export interface QuizFormValues {
  questions: IQuestion[];
}

export interface ICourse {
  _id: string;
  courseName: string;
}

// Instead of an array, you work with just a single question
export interface SingleQuestionFormValues {
  questionText: string;
  options: string[];
  correctAnswer: string;
}


// IQuiz.ts

export interface IQuestionPayload {
  questionText: string;
  options: string[];
  correctAnswer: string;
}
