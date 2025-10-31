import { Response } from "express";
import { Types } from "mongoose";
import { IWithdrawalRequestService } from "../../services/interface/IWithdrawalRequestService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IInstructorWithdrawalController } from "./interfaces/IInstructorWithdrawalController";
import {
  INSTRUCTOR_SUCCESS_MESSAGE,
} from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import { handleControllerError } from "../../utils/errorHandlerUtil";

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
    } catch (error) {
      appLogger.error("Error in withdrawal creation", { error });
      handleControllerError(error, res);
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

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          transactions,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      appLogger.error("Error in withdrawal requests", { error });
      handleControllerError(error, res);
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
    } catch (error) {
      appLogger.error("Error in retry withdrawal request", { error });
      handleControllerError(error, res);
    }
  }
}