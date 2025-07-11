// QuizReadOnlyRepository.ts
import { IQuizReadOnlyRepository } from "../interfaces/IQuizReadOnlyRepository";
import { QuizModel } from "../../models/quizModel";
import mongoose from "mongoose";

export class QuizReadOnlyRepository implements IQuizReadOnlyRepository {
  async countQuestionsByCourse(courseId: string): Promise<number> {
    const quiz = await QuizModel.findOne(
      { courseId: new mongoose.Types.ObjectId(courseId) },
      { questions: 1 }
    );
    return quiz?.questions.length || 0;
  }
}
