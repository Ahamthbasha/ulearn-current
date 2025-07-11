import { Request, Response, NextFunction } from "express";
import { IInstructorQuizController } from "./interfaces/IInstructorQuizController";
import { IInstructorQuizService } from "../../services/interface/IInstructorQuizService";
import { StatusCode } from "../../utils/enums";
import { QuizErrorMessages, QuizSuccessMessages } from "../../utils/constants";

export class InstructorQuizController implements IInstructorQuizController {
  private quizService: IInstructorQuizService
  constructor(quizService: IInstructorQuizService) {
    this.quizService = quizService
  }

  async createQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: QuizErrorMessages.COURSE_ID_REQUIRED,
      });
      return;
    }

    const existing = await this.quizService.getQuizByCourseId(courseId);

    if (existing) {
      res.status(StatusCode.CONFLICT).json({
        success: false,
        message: QuizErrorMessages.QUIZ_ALREAD_CREATED,
      });
      return;
    }

    const created = await this.quizService.createQuiz(req.body);

    res.status(StatusCode.CREATED).json({
      success: true,
      message: QuizSuccessMessages.QUIZ_CREATED,
      data: created,
    });
  } catch (err) {
    next(err);
  }
}


  async deleteQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quizId } = req.params;
      const deleted = await this.quizService.deleteQuiz(quizId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: QuizErrorMessages.QUIZ_OR_QUESTION_NOT_FOUND});
        return;
      }
      res.status(StatusCode.OK)
      .json({ 
        success: true,
        message: QuizSuccessMessages.QUIZ_DELETED });
    } catch (err) {
      next(err);
    }
  }

  async getQuizById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { quizId } = req.params;
      const quiz = await this.quizService.getQuizById(quizId);
      if (!quiz) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Quiz not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: quiz });
    } catch (err) {
      next(err);
    }
  }

  async getQuizByCourseId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const quiz = await this.quizService.getQuizByCourseId(courseId); // returns IQuiz | null

    if (!quiz) {
      res.status(StatusCode.OK).json({
        success: true,
        message: "No quiz found",
        data: { courseId, questions: [] },
      });
      return;
    }

    const questions = quiz.questions?.map((q) => ({
      ...q.toObject?.(), // handle Mongoose subdocument
      quizId: quiz._id,
    })) || [];

    res.status(StatusCode.OK).json({
      success: true,
      message: QuizSuccessMessages.QUIZ_FETCHED,
      data: { courseId, questions },
    });
  } catch (err) {
    next(err);
  }
}

  async addQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const added = await this.quizService.addQuestionToQuiz(courseId, req.body);

    res.status(StatusCode.CREATED).json({
      success: true,
      message: QuizSuccessMessages.QUESTION_ADDED,
      data: added,
    });
  } catch (err: any) {
    if (err.message?.includes("already exists")) {
      res.status(StatusCode.CONFLICT).json({
        success: false,
        message: err.message,
      });
    } else {
      next(err);
    }
  }
}

async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId, questionId } = req.params;
    const updated = await this.quizService.updateQuestionInQuiz(quizId, questionId, req.body);

    if (!updated) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: QuizErrorMessages.QUIZ_OR_QUESTION_NOT_FOUND,
      });
      return;
    }

    res.status(StatusCode.OK).json({
      success: true,
      message: QuizSuccessMessages.QUESTION_UPDATED,
      data: updated,
    });
  } catch (err: any) {
    console.log(err)
    if (err.message?.includes("already exists")) {
      res.status(StatusCode.CONFLICT).json({
        success: false,
        message: err.message,
      });
    } else {
      next(err);
    }
  }
}

async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quizId, questionId } = req.params;
    const deleted = await this.quizService.deleteQuestionFromQuiz(quizId, questionId);

    if (!deleted) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: QuizErrorMessages.QUIZ_OR_QUESTION_NOT_FOUND,
      });
      return;
    }

    res.status(StatusCode.OK).json({
      success: true,
      message: QuizSuccessMessages.QUESTION_DELETED,
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
}

async getPaginatedQuestionsByCourseId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const { page = "1", limit = "10", search = "" } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const { questions, total,quizId } = await this.quizService.getPaginatedQuestionsByCourseId(
      courseId,
      String(search),
      pageNum,
      limitNum
    );

    res.status(StatusCode.OK).json({
      success: true,
      message: QuizSuccessMessages.QUIZ_FETCHED,
      data: {
        quizId,
        courseId,
        questions,
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    next(err);
  }
}


}
