import { Request, Response } from "express";
import { IAdminVerificationService } from "../../services/adminServices/interface/IAdminVerificationService";
import { StatusCode } from "../../utils/enums";
import {
  AdminErrorMessages,
  AdminSuccessMessages,
  ResponseError,
} from "../../utils/constants";
import { IEmail } from "../../types/Email";
import { BadRequestError, NotFoundError } from "../../utils/error";
import { appLogger } from "../../utils/logger";
import { handleControllerError } from "../../utils/errorHandlerUtil";
import IAdminVerificationController from "./interface/IAdminVerificationController";

export class AdminVerificationController implements IAdminVerificationController {
  constructor(
    private readonly verificationService: IAdminVerificationService,
    private readonly emailService: IEmail
  ) {}

  async getAllRequests(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(
        1,
        Math.min(100, parseInt(req.query.limit as string) || 10)
      );
      const search = (req.query.search as string) || "";

      const { data, total } = await this.verificationService.getAllRequests(
        page,
        limit,
        search
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: AdminSuccessMessages.ADMIN_FETCHED_VERIFICATION_REQUEST,
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      appLogger.error("Error getting all verification requests", { error });
      handleControllerError(error, res);
    }
  }

  async getRequestData(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      
      if (!email) {
        throw new BadRequestError("Email parameter is required");
      }

      const requestData =
        await this.verificationService.getRequestDataByEmail(email);

      if (!requestData) {
        throw new NotFoundError(
          AdminErrorMessages.ADMIN_VERIFICATION_REQUEST_NOT_FOUND
        );
      }

      res.status(StatusCode.OK).json({ 
        success: true, 
        data: requestData 
      });
    } catch (error) {
      appLogger.error("Error getting verification request data", { error });
      handleControllerError(error, res);
    }
  }

  async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      const { email, status, reason } = req.body;

      // Validation
      if (!email || !status) {
        throw new BadRequestError("Email and status are required");
      }

      if (status !== "approved" && status !== "rejected") {
        throw new BadRequestError(
          AdminErrorMessages.ADMIN_INVALID_REQUEST_STATUS
        );
      }

      if (status === "rejected" && !reason) {
        throw new BadRequestError(
          AdminErrorMessages.ADMIN_VERIFICATION_REJECTION
        );
      }

      const approvedRequest = await this.verificationService.approveRequest(
        email,
        status,
        reason
      );

      if (!approvedRequest) {
        throw new NotFoundError("Verification request not found");
      }

      const name = approvedRequest.username;

      if (status === "approved") {
        await this.emailService.sendVerificationSuccessEmail(name, email);
        res.status(StatusCode.OK).json({
          success: true,
          message: ResponseError.APPROVE_INSTRUCTOR,
          data: approvedRequest,
        });
      } else {
        await this.emailService.sendRejectionEmail(name, email, reason);
        res.status(StatusCode.OK).json({
          success: true,
          message: ResponseError.REJECT_INSTRUCTOR,
          data: approvedRequest,
        });
      }
    } catch (error) {
      appLogger.error("Error approving/rejecting verification request", { 
        error 
      });
      handleControllerError(error, res);
    }
  }
}