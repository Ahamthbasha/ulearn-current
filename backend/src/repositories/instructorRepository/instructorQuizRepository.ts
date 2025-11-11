import mongoose from "mongoose";
import { QuizModel, IQuiz } from "../../models/quizModel";
import { IInstructorQuizRepository } from "./interface/IInstructorQuizRepository";
import { GenericRepository } from "../genericRepository";

export class InstructorQuizRepository
  extends GenericRepository<IQuiz>
  implements IInstructorQuizRepository
{
  constructor() {
    super(QuizModel);
  }

  async createQuiz(data: Partial<IQuiz>): Promise<IQuiz> {
    return await this.create(data);
  }

  async deleteQuiz(id: string): Promise<IQuiz | null> {
    return await this.delete(id);
  }

  async getQuizById(id: string): Promise<IQuiz | null> {
    return await this.findById(id);
  }

  async getQuizByModuleId(moduleId: string): Promise<IQuiz | null> {
    return await this.findOne({
      moduleId: new mongoose.Types.ObjectId(moduleId),
    });
  }

  async addQuestionToQuiz(
  moduleId: string,
  question: IQuiz["questions"][0]
): Promise<IQuiz> {
  const quiz = await this.getQuizByModuleId(moduleId);
  if (!quiz) {
    throw new Error("Quiz not found for this module");
  }

  question.options = question.options.map((opt) => opt.toLowerCase());

  const isDuplicate = quiz.questions.some(
    (q) =>
      q.questionText.trim().toLowerCase() ===
      question.questionText.trim().toLowerCase()
  );

  if (isDuplicate) {
    throw new Error("Question already exists in the quiz");
  }

  quiz.questions.push(question);
  return await quiz.save();
}

async updateQuestionInQuiz(
  quizId: string,
  questionId: string,
  updatedData: Partial<IQuiz["questions"][0]>
): Promise<IQuiz | null> {
  const quiz = await this.findById(quizId);
  if (!quiz) return null;

  const question = quiz.questions.id(questionId);
  if (!question) return null;

  if (updatedData.options) {
    updatedData.options = updatedData.options.map((opt) => opt.toLowerCase());
  }

  const newText = updatedData.questionText?.trim().toLowerCase();
  if (newText) {
    const isDuplicate = quiz.questions.some((q: any) => {
      return (
        q._id.toString() !== questionId &&
        q.questionText.trim().toLowerCase() === newText
      );
    });

    if (isDuplicate) {
      throw new Error("Another question with the same text already exists");
    }
  }

  question.set(updatedData);
  return await quiz.save();
}


  async deleteQuestionFromQuiz(
    quizId: string,
    questionId: string
  ): Promise<IQuiz | null> {
    const quiz = await this.findById(quizId);
    if (!quiz) return null;

    quiz.questions.pull({ _id: questionId });
    return await quiz.save();
  }

  async getPaginatedQuestionsByModuleId(
    moduleId: string,
    search: string,
    page: number,
    limit: number
  ): Promise<{
    questions: IQuiz["questions"][0][];
    total: number;
    quizId: string | null;
  }> {
    const quiz = await this.getQuizByModuleId(moduleId);
    if (!quiz) {
      return { questions: [], total: 0, quizId: null };
    }

    const filtered = quiz.questions.filter((q) =>
      q.questionText.toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      questions: paginated,
      total,
      quizId: quiz._id.toString(),
    };
  }
}