import { IQuizReadOnlyRepository } from "../interfaces/IQuizReadOnlyRepository";
import { QuizModel, IQuiz } from "../../models/quizModel";
import mongoose from "mongoose";
import { GenericRepository } from "../genericRepository";
export class QuizReadOnlyRepository
  extends GenericRepository<IQuiz>
  implements IQuizReadOnlyRepository
{
  constructor() {
    super(QuizModel);
  }
  async countQuestionsByCourse(courseId: string): Promise<number> {
    const quiz = await this.findOneWithProjection(
      { courseId: new mongoose.Types.ObjectId(courseId) },
      { questions: 1 },
    );
    return quiz?.questions.length || 0;
  }
}
