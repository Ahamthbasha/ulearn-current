import { IInstructorQuizService } from "./interface/IInstructorQuizService"; 
import { IInstructorQuizRepository } from "../../repositories/instructorRepository/interface/IInstructorQuizRepository"; 
import { IQuiz } from "../../models/quizModel";

export class InstructorQuizService implements IInstructorQuizService {
  private _quizRepo: IInstructorQuizRepository
  constructor(quizRepo: IInstructorQuizRepository) {
    this._quizRepo = quizRepo
  }

  async createQuiz(data: Partial<IQuiz>): Promise<IQuiz> {
    return await this._quizRepo.createQuiz(data);
  }


  async deleteQuiz(id: string): Promise<IQuiz | null> {
    return await this._quizRepo.deleteQuiz(id);
  }

  async getQuizById(id: string): Promise<IQuiz | null> {
    return await this._quizRepo.getQuizById(id);
  }

  async getQuizByCourseId(courseId: string): Promise<IQuiz | null> {
    return await this._quizRepo.getQuizByCourseId(courseId);
  }

  async addQuestionToQuiz(courseId: string, question: IQuiz["questions"][0]): Promise<IQuiz> {
    return await this._quizRepo.addQuestionToQuiz(courseId, question);
  }

  async updateQuestionInQuiz(quizId: string, questionId: string, updatedData: Partial<IQuiz["questions"][0]>): Promise<IQuiz | null> {
    return await this._quizRepo.updateQuestionInQuiz(quizId, questionId, updatedData);
  }

  async deleteQuestionFromQuiz(quizId: string, questionId: string): Promise<IQuiz | null> {
    return await this._quizRepo.deleteQuestionFromQuiz(quizId, questionId);
  }

async getPaginatedQuestionsByCourseId(
  courseId: string,
  search: string,
  page: number,
  limit: number
): Promise<{ questions: IQuiz["questions"][0][], total: number, quizId: string | null }> {
  return await this._quizRepo.getPaginatedQuestionsByCourseId(courseId, search, page, limit);
}


}
