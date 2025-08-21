import { IQuiz, QuizModel } from "../models/quizModel";
import { GenericRepository } from "./genericRepository";

export class QuizDetailRepository extends GenericRepository<IQuiz> {
  constructor() {
    super(QuizModel);
  }
}
