import { Request, Response, NextFunction } from "express";
import { IInstructorQuizController } from "./interfaces/IInstructorQuizController";
import { IInstructorQuizService } from "../../services/instructorServices/interface/IInstructorQuizService";
import { StatusCode } from "../../utils/enums";
import {
  QuizErrorMessages,
  QuizSuccessMessages,
} from "../../utils/constants";

const isError = (err: unknown): err is Error => {
  return err instanceof Error;
};

export class InstructorQuizController implements IInstructorQuizController {
  private _quizService: IInstructorQuizService;

  constructor(quizService: IInstructorQuizService) {
    this._quizService = quizService;
  }

  async createQuiz(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = req.body;

      if (!moduleId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: QuizErrorMessages.MODULE_ID_REQUIRED,
        });
        return;
      }

      const existing = await this._quizService.getQuizByModuleId(moduleId);
      if (existing) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: QuizErrorMessages.QUIZ_ALREADY_CREATED,
        });
        return;
      }

      const created = await this._quizService.createQuiz({ moduleId });
      res.status(StatusCode.CREATED).json({
        success: true,
        message: QuizSuccessMessages.QUIZ_CREATED,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteQuiz(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quizId } = req.params;
      const deleted = await this._quizService.deleteQuiz(quizId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: QuizErrorMessages.QUIZ_OR_QUESTION_NOT_FOUND,
        });
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        message: QuizSuccessMessages.QUIZ_DELETED,
      });
    } catch (err) {
      next(err);
    }
  }

  async getQuizById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quizId } = req.params;
      const quiz = await this._quizService.getQuizById(quizId);
      if (!quiz) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: QuizErrorMessages.QUIZ_NOT_FOUND,
        });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: quiz });
    } catch (err) {
      next(err);
    }
  }

  async getQuizByModuleId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = req.params;
      const quiz = await this._quizService.getQuizByModuleId(moduleId);

      if (!quiz) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: QuizErrorMessages.QUIZ_NOT_FOUND_FOR_THIS_MODULE,
          data: { moduleId, questions: [] },
        });
        return;
      }

      const questions = quiz.questions.map((q) => ({
        ...q.toObject(),
        quizId: quiz._id,
      }));

      res.status(StatusCode.OK).json({
        success: true,
        message: QuizSuccessMessages.QUIZ_FETCHED,
        data: { moduleId, questions },
      });
    } catch (err) {
      next(err);
    }
  }

  async addQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = req.params;
      const added = await this._quizService.addQuestionToQuiz(moduleId, req.body);

      res.status(StatusCode.CREATED).json({
        success: true,
        message: QuizSuccessMessages.QUESTION_ADDED,
        data: added,
      });
    } catch (err) {
      if (isError(err) && err.message.includes("already exists")) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: err.message,
        });
      } else {
        next(err);
      }
    }
  }

  async updateQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quizId, questionId } = req.params;
      const updated = await this._quizService.updateQuestionInQuiz(
        quizId,
        questionId,
        req.body
      );

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
    } catch (err) {
      if (isError(err) && err.message.includes("already exists")) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: err.message,
        });
      } else {
        next(err);
      }
    }
  }

  async deleteQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quizId, questionId } = req.params;
      const deleted = await this._quizService.deleteQuestionFromQuiz(
        quizId,
        questionId
      );

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

  async getPaginatedQuestionsByModuleId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { moduleId } = req.params;
      const { page = "1", limit = "10", search = "" } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);

      const { questions, total, quizId } =
        await this._quizService.getPaginatedQuestionsByModuleId(
          moduleId,
          String(search),
          pageNum,
          limitNum
        );

      res.status(StatusCode.OK).json({
        success: true,
        message: QuizSuccessMessages.QUIZ_FETCHED,
        data: {
          quizId,
          moduleId,
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