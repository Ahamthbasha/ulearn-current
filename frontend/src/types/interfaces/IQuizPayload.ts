export default interface QuizPayload {
  courseId: string;
  quizId: string;
  correctAnswers: number;
  totalQuestions: number;
  percentage:number
}
