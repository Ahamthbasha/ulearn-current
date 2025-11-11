import { IQuiz } from "../../../models/quizModel";

export interface IInstructorQuizRepository {
  createQuiz(data: Partial<IQuiz>): Promise<IQuiz>;
  deleteQuiz(id: string): Promise<IQuiz | null>;
  getQuizById(id: string): Promise<IQuiz | null>;
  getQuizByModuleId(moduleId: string): Promise<IQuiz | null>;

  addQuestionToQuiz(
    moduleId: string,
    question: IQuiz["questions"][0]
  ): Promise<IQuiz>;

  updateQuestionInQuiz(
    quizId: string,
    questionId: string,
    updatedData: Partial<IQuiz["questions"][0]>
  ): Promise<IQuiz | null>;

  deleteQuestionFromQuiz(
    quizId: string,
    questionId: string
  ): Promise<IQuiz | null>;

  getPaginatedQuestionsByModuleId(
    moduleId: string,
    search: string,
    page: number,
    limit: number
  ): Promise<{
    questions: IQuiz["questions"][0][];
    total: number;
    quizId: string | null;
  }>;
}