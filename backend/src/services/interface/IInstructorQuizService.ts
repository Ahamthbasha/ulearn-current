import { IQuiz } from "../../models/quizModel";

export interface IInstructorQuizService {
  createQuiz(data: Partial<IQuiz>): Promise<IQuiz>;
  deleteQuiz(id: string): Promise<IQuiz | null>;
  getQuizById(id: string): Promise<IQuiz | null>;
  getQuizByCourseId(courseId: string): Promise<IQuiz | null>;

  addQuestionToQuiz(courseId: string, question: IQuiz["questions"][0]): Promise<IQuiz>;
  updateQuestionInQuiz(quizId: string, questionId: string, updatedData: Partial<IQuiz["questions"][0]>): Promise<IQuiz | null>;
  deleteQuestionFromQuiz(quizId: string, questionId: string): Promise<IQuiz | null>;


  getPaginatedQuestionsByCourseId(
  courseId: string,
  search: string,
  page: number,
  limit: number
): Promise<{ questions: IQuiz["questions"][0][], total: number,quizId:string|null }>;

}
