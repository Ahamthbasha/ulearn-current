import { Request, Response } from "express";
import { IAdminVerificationService } from "../../services/adminServices/interface/IAdminVerificationService";
import { StatusCode } from "../../utils/enums";
import {
  AdminErrorMessages,
  AdminSuccessMessages,
  ResponseError,
} from "../../utils/constants";
import { SendEmail } from "../../utils/sendOtpEmail";

export class AdminVerificationController {
  private _verificationService: IAdminVerificationService;
  private _emailService: SendEmail;

  constructor(verificationService: IAdminVerificationService) {
    this._verificationService = verificationService;
    this._emailService = new SendEmail();
  }

  async getAllRequests(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const { data, total } = await this._verificationService.getAllRequests(
        page,
        limit,
        search,
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: AdminSuccessMessages.ADMIN_FETCHED_VERIFICATION_REQUEST,
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message || AdminErrorMessages.ADMIN_VERIFICATION_FETCH_ERROR,
      });
    }
  }

  async getRequestData(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      const requestData =
        await this._verificationService.getRequestDataByEmail(email);

      if (!requestData) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: AdminErrorMessages.ADMIN_VERIFICATION_REQUEST_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({ data: requestData });
    } catch (error: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      const { email, status, reason } = req.body;

      const approvedRequest = await this._verificationService.approveRequest(
        email,
        status,
        reason,
      );

      if (!approvedRequest) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: AdminErrorMessages.ADMIN_VERIFICATION_REQUEST_NOT_FOUND,
        });
        return;
      }

      const name = approvedRequest.username;

      if (status === "approved") {
        await this._emailService.sendVerificationSuccessEmail(name, email);
        res.status(StatusCode.OK).json({
          success: true,
          message: ResponseError.APPROVE_INSTRUCTOR,
          data: approvedRequest,
        });
      } else if (status === "rejected") {
        if (!reason) {
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: AdminErrorMessages.ADMIN_VERIFICATION_REJECTION,
          });
          return;
        }

        await this._emailService.sendRejectionEmail(name, email, reason);
        res.status(StatusCode.OK).json({
          success: true,
          message: ResponseError.REJECT_INSTRUCTOR,
          data: approvedRequest,
        });
      } else {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_INVALID_REQUEST_STATUS,
        });
      }
    } catch (error: any) {
      res
        .status(StatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  }
}
