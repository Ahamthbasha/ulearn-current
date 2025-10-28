import { Response } from "express";
import { Types } from "mongoose";
import { IWithdrawalRequestService } from "../../services/interface/IWithdrawalRequestService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IInstructorWithdrawalController } from "./interfaces/IInstructorWithdrawalController";
import {
  INSTRUCTOR_ERROR_MESSAGE,
  INSTRUCTOR_SUCCESS_MESSAGE,
} from "../../utils/constants";
import { appLogger } from "../../utils/logger";

export class InstructorWithdrawalController
  implements IInstructorWithdrawalController
{
  private _withdrawalRequestService: IWithdrawalRequestService;
  constructor(withdrawalRequestService: IWithdrawalRequestService) {
    this._withdrawalRequestService = withdrawalRequestService;
  }

  async createWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = new Types.ObjectId(req.user?.id);
      const { amount } = req.body;

      const request =
        await this._withdrawalRequestService.createWithdrawalRequest(
          instructorId,
          amount,
        );

      res.status(StatusCode.OK).json({
        success: true,
        message: INSTRUCTOR_SUCCESS_MESSAGE.WITHDRAWAL_REQUEST_CREATED,
        data: request,
      });
    } catch (error: any) {
      appLogger.error("error in withdrawal creation", error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message:
          error.message ||
          INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_CREATE_WITHDRAWAL_REQUEST,
      });
    }
  }

  async getWithdrawalRequestsWithPagination(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = new Types.ObjectId(req.user?.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { transactions, total } =
        await this._withdrawalRequestService.getInstructorRequestsWithPagination(
          instructorId,
          { page, limit },
        );

      // const mappedTransactions = transactions.map(toWithdrawalRequestListDTO);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          transactions: transactions,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error: any) {
      appLogger.error("error in withdrawalrequests", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_FETCH_WITHDRAWAL_REQUEST,
      });
    }
  }

  async retryWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const requestId = new Types.ObjectId(req.params.requestId);
      const { amount } = req.body; // Optional: allow changing the amount

      const request =
        await this._withdrawalRequestService.retryWithdrawalRequest(
          requestId,
          amount,
        );

      res.status(StatusCode.OK).json({
        success: true,
        message:
          INSTRUCTOR_SUCCESS_MESSAGE.WITHDRAWAL_REQUEST_RETRIED_SUCCESSFULLY,
        data: request,
      });
    } catch (error: any) {
      appLogger.error("error in retry withdrawal request", error);
      const statusCode = error.message.includes(
        INSTRUCTOR_ERROR_MESSAGE.NOT_FOUND,
      )
        ? StatusCode.NOT_FOUND
        : error.message.includes(INSTRUCTOR_ERROR_MESSAGE.ONLY_REJECTED)
          ? StatusCode.BAD_REQUEST
          : StatusCode.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        message:
          error.message ||
          INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_RETRY_WITHDRAWAL_REQUEST,
      });
    }
  }
}
