import { Response } from "express";
import { Types } from "mongoose";
import { IWithdrawalRequestService } from "../../services/interface/IWithdrawalRequestService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IAdminWithdrawalController } from "./interface/IAdminWithdrawalController";
import { AdminErrorMessages, AdminSuccessMessages } from "../../utils/constants";

export class AdminWithdrawalController implements IAdminWithdrawalController {
  private _withdrawalRequestService: IWithdrawalRequestService
  
  constructor(withdrawalRequestService: IWithdrawalRequestService) {
    this._withdrawalRequestService = withdrawalRequestService
  }

  async getAllWithdrawalRequests(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';

      if (page < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_PAGENO_VALIDATION,
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_LIMIT_VALIDATION,
        });
        return;
      }

      const { transactions, total } = await this._withdrawalRequestService.getAllRequestsWithPagination({
        page,
        limit,
        search: search.trim(),
      });

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          transactions,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          search: search.trim(),
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.ADMIN_FAILED_FETCH_WITHDRAWAL_REQUEST,
      });
    }
  }

  async approveWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.user?.id);
      const { requestId, remarks } = req.body;

      const request = await this._withdrawalRequestService.approveWithdrawalRequest(
        new Types.ObjectId(requestId),
        adminId,
        remarks
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: AdminSuccessMessages.ADMIN_APPROVE_WITHDRAWAL,
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message || AdminErrorMessages.ADMIN_FAILED_TO_APPROVE_WITHDRAWAL,
      });
    }
  }

  async rejectWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.user?.id);
      const { requestId, remarks } = req.body;

      const request = await this._withdrawalRequestService.rejectWithdrawalRequest(
        new Types.ObjectId(requestId),
        adminId,
        remarks
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: AdminSuccessMessages.ADMIN_REJECT_WITHDRAWAL,
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message || AdminErrorMessages.ADMIN_FAILED_TO_REJECT_WITHDRAWAL,
      });
    }
  }

  async getWithdrawalRequestById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { requestId } = req.params;

      if (!Types.ObjectId.isValid(requestId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_INVALID_ID_FORMAT,
        });
        return;
      }

      const withdrawalDetailRequest = await this._withdrawalRequestService.getWithdrawalRequestById(
        new Types.ObjectId(requestId)
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: withdrawalDetailRequest,
      });
    } catch (error: any) {
      console.error("Error fetching withdrawal request by ID:", error);

      if (error.message === AdminErrorMessages.ADMIN_WITHDRAWAL_REQUEST_NOTFOUND) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || AdminErrorMessages.ADMIN_FAILED_TO_FETCH_WITHDRAWAL_REQUEST,
      });
    }
  }
}