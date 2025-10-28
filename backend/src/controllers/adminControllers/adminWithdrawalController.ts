import { Response } from "express";
import { Types } from "mongoose";
import { IWithdrawalRequestService } from "../../services/interface/IWithdrawalRequestService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IAdminWithdrawalController } from "./interface/IAdminWithdrawalController";
import {
  AdminErrorMessages,
  AdminSuccessMessages,
  AdminWithdrawalMessage,
} from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import { BadRequestError, NotFoundError } from "../../utils/error";
import { handleControllerError } from "../../utils/errorHandlerUtil";

export class AdminWithdrawalController implements IAdminWithdrawalController {
  private _withdrawalRequestService: IWithdrawalRequestService;

  constructor(withdrawalRequestService: IWithdrawalRequestService) {
    this._withdrawalRequestService = withdrawalRequestService;
  }

  async getAllWithdrawalRequests(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || "";

      if (page < 1) {
        throw new BadRequestError(AdminErrorMessages.ADMIN_PAGENO_VALIDATION);
      }

      if (limit < 1 || limit > 100) {
        throw new BadRequestError(AdminErrorMessages.ADMIN_LIMIT_VALIDATION);
      }

      if (status && !["pending", "approved", "rejected"].includes(status)) {
        throw new BadRequestError(AdminWithdrawalMessage.STATUS_FILTER);
      }

      const { transactions, total } =
        await this._withdrawalRequestService.getAllRequestsWithPagination({
          page,
          limit,
          search: search.trim(),
          status: status.trim(),
        });

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          transactions,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          search: search.trim(),
          status: status.trim(),
        },
      });
    } catch (error) {
      appLogger.error("Error getting all withdrawal requests", { error });
      handleControllerError(error, res);
    }
  }

  async approveWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.user?.id);
      const { requestId, remarks } = req.body;

      if (!requestId) {
        throw new BadRequestError("Request ID is required");
      }

      const request =
        await this._withdrawalRequestService.approveWithdrawalRequest(
          new Types.ObjectId(requestId),
          adminId,
          remarks,
        );

      res.status(StatusCode.OK).json({
        success: true,
        message: AdminSuccessMessages.ADMIN_APPROVE_WITHDRAWAL,
        data: request,
      });
    } catch (error) {
      appLogger.error("Error approving withdrawal request", { error });
      handleControllerError(error, res);
    }
  }

  async rejectWithdrawalRequest(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const adminId = new Types.ObjectId(req.user?.id);
      const { requestId, remarks } = req.body;

      if (!requestId) {
        throw new BadRequestError("Request ID is required");
      }

      const request =
        await this._withdrawalRequestService.rejectWithdrawalRequest(
          new Types.ObjectId(requestId),
          adminId,
          remarks,
        );

      res.status(StatusCode.OK).json({
        success: true,
        message: AdminSuccessMessages.ADMIN_REJECT_WITHDRAWAL,
        data: request,
      });
    } catch (error) {
      appLogger.error("Error rejecting withdrawal request", { error });
      handleControllerError(error, res);
    }
  }

  async getWithdrawalRequestById(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const { requestId } = req.params;

      if (!Types.ObjectId.isValid(requestId)) {
        throw new BadRequestError(AdminErrorMessages.ADMIN_INVALID_ID_FORMAT);
      }

      const withdrawalDetailRequest =
        await this._withdrawalRequestService.getWithdrawalRequestById(
          new Types.ObjectId(requestId),
        );

      if (!withdrawalDetailRequest) {
        throw new NotFoundError(
          AdminErrorMessages.ADMIN_WITHDRAWAL_REQUEST_NOTFOUND
        );
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: withdrawalDetailRequest,
      });
    } catch (error) {
      appLogger.error("Error fetching withdrawal request by ID", { error });
      handleControllerError(error, res);
    }
  }
}