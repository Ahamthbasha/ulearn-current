import { Response } from 'express';
import { Types } from 'mongoose';
import { IWithdrawalRequestService } from '../../services/interface/IWithdrawalRequestService';
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from '../../middlewares/AuthenticatedRoutes';
import { IInstructorWithdrawalController } from './interfaces/IInstructorWithdrawalController';

export class InstructorWithdrawalController implements IInstructorWithdrawalController {
  constructor(private withdrawalRequestService: IWithdrawalRequestService) {}

  async createWithdrawalRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new Types.ObjectId(req.user?.id);
      const { amount } = req.body;

      const request = await this.withdrawalRequestService.createWithdrawalRequest(
        instructorId,
        amount
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: 'Withdrawal request created successfully',
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create withdrawal request',
      });
    }
  }

  async getWithdrawalRequestsWithPagination(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new Types.ObjectId(req.user?.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Page number must be greater than 0',
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Limit must be between 1 and 100',
        });
        return;
      }

      const { transactions, total } = await this.withdrawalRequestService.getInstructorRequestsWithPagination(
        instructorId,
        { page, limit }
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
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch withdrawal requests',
      });
    }
  }

  async retryWithdrawalRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requestId = new Types.ObjectId(req.params.requestId);
      const { amount } = req.body; // Optional: allow changing the amount

      const request = await this.withdrawalRequestService.retryWithdrawalRequest(
        requestId,
        amount
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: 'Withdrawal request retried successfully',
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      const statusCode = error.message.includes('not found') ? StatusCode.NOT_FOUND :
                        error.message.includes('Only rejected') ? StatusCode.BAD_REQUEST :
                        StatusCode.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retry withdrawal request',
      });
    }
  }
}