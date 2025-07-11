import mongoose from "mongoose";
import { QuizModel, IQuiz } from "../../models/quizModel";
import { IInstructorQuizRepository } from "../interfaces/IInstructorQuizRepository";
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

  async getQuizByCourseId(courseId: string): Promise<IQuiz | null> {
    return await this.findOne({ courseId: new mongoose.Types.ObjectId(courseId) });
  }

  async addQuestionToQuiz(courseId: string, question: IQuiz["questions"][0]): Promise<IQuiz> {
  const quiz = await this.findOne({ courseId: new mongoose.Types.ObjectId(courseId) });
  if (!quiz) throw new Error("Quiz not found for this course");

  const isDuplicate = quiz.questions.some(q =>
    q.questionText.trim().toLowerCase() === question.questionText.trim().toLowerCase()
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

  const currentQuestion = quiz.questions.id(questionId);
  if (!currentQuestion) return null;

  const newText = updatedData.questionText?.trim().toLowerCase();
  if (newText) {
    const isDuplicate = quiz.questions.some((q) => {
      const question = q as typeof quiz.questions[0] & { _id: mongoose.Types.ObjectId };
      return (
        question._id.toString() !== questionId &&
        question.questionText.trim().toLowerCase() === newText
      );
    });

    if (isDuplicate) {
      throw new Error("Another question with the same text already exists");
    }
  }

  currentQuestion.set(updatedData);
  return await quiz.save();
}



  async deleteQuestionFromQuiz(quizId: string, questionId: string): Promise<IQuiz | null> {
  const quiz = await this.findById(quizId);
  if (!quiz) return null;

  quiz.questions.pull({ _id: questionId }); // ✅ Replace .remove() with .pull()
  return await quiz.save();
}


async getPaginatedQuestionsByCourseId(
  courseId: string,
  search: string,
  page: number,
  limit: number
): Promise<{ questions: IQuiz["questions"][0][], total: number, quizId: string | null }> {
  const quiz = await this.findOne({ courseId: new mongoose.Types.ObjectId(courseId) });
  if (!quiz) return { questions: [], total: 0, quizId: null };

  const filtered = quiz.questions.filter(q =>
    q.questionText.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return {
    questions: paginated,
    total,
    quizId: (quiz._id as mongoose.Types.ObjectId).toString()
  };
}



}
