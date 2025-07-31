import { Response } from 'express';
import { Types } from 'mongoose';
import { IWithdrawalRequestService } from '../../services/interface/IWithdrawalRequestService';
import { StatusCode } from '../../utils/enums';
import { AuthenticatedRequest } from '../../middlewares/AuthenticatedRoutes';
import { IAdminWithdrawalController } from './interface/IAdminWithdrawalController';

export class AdminWithdrawalController implements IAdminWithdrawalController {
  constructor(private withdrawalRequestService: IWithdrawalRequestService) {}

  async getAllWithdrawalRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      const { transactions, total } = await this.withdrawalRequestService.getAllRequestsWithPagination(
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

  async approveWithdrawalRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.user?.id);
      const { requestId, remarks } = req.body;

      const request = await this.withdrawalRequestService.approveWithdrawalRequest(
        new Types.ObjectId(requestId),
        adminId,
        remarks
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: 'Withdrawal request approved successfully',
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to approve withdrawal request',
      });
    }
  }

  async rejectWithdrawalRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.user?.id);
      const { requestId, remarks } = req.body;

      const request = await this.withdrawalRequestService.rejectWithdrawalRequest(
        new Types.ObjectId(requestId),
        adminId,
        remarks
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: 'Withdrawal request rejected successfully',
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to reject withdrawal request',
      });
    }
  }

  async getWithdrawalRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;

      if (!Types.ObjectId.isValid(requestId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Invalid request ID format',
        });
        return;
      }

      const request = await this.withdrawalRequestService.getWithdrawalRequestById(
        new Types.ObjectId(requestId)
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: request,
      });
    } catch (error: any) {
      console.error('Error fetching withdrawal request by ID:', error);
      
      if (error.message === 'Withdrawal request not found') {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to fetch withdrawal request',
      });
    }
  }
}