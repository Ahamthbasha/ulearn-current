import { Request, Response } from 'express';
import { IAdminVerificationService } from '../../services/interface/IAdminVerificationService';
import { StatusCode } from '../../utils/enums';
import { ResponseError } from '../../utils/constants';
import { getPresignedUrl } from '../../utils/getPresignedUrl';
import { SendEmail } from '../../utils/sendOtpEmail';
export class AdminVerificationController {
  private verificationService: IAdminVerificationService;
  private emailService : SendEmail;
  constructor(verificationService: IAdminVerificationService) {
    this.verificationService = verificationService;
    this.emailService = new SendEmail()
  }

  async getAllRequests(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const { data, total } = await this.verificationService.getAllRequests(page, limit, search);

    res.status(StatusCode.OK).json({
      success: true,
      message: "Verification requests fetched successfully",
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong while fetching verification requests"
    });
  }
}


async getRequestData(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.params;
    const requestData = await this.verificationService.getRequestDataByEmail(email);

    if (!requestData) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: "Verification request not found.",
      });
      return;
    }

    // ✅ Use existing keys from DB (they contain the S3 object key)
    const resumeUrl = await getPresignedUrl(requestData.resumeUrl);
    const degreeCertificateUrl = await getPresignedUrl(requestData.degreeCertificateUrl);

    res.status(StatusCode.OK).json({
      data: {
        ...requestData.toObject(), // ensure it's a plain object
        resumeUrl,
        degreeCertificateUrl,
      },
    });
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

    const approvedRequest = await this.verificationService.approveRequest(email, status, reason);

    if (!approvedRequest) {
      res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Verification request not found" });
      return;
    }

    const name = approvedRequest.username;

    if (status === "approved") {
      // ✅ Send success email
      await this.emailService.sendVerificationSuccessEmail(name, email);

      res.status(StatusCode.OK).json({
        success: true,
        message: ResponseError.APPROVE_INSTRUCTOR,
        data: approvedRequest,
      });
    } else if (status === "rejected") {
      // ✅ Send rejection email
      if (!reason) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Rejection reason is required." });
        return;
      }

      await this.emailService.sendRejectionEmail(name, email, reason);

      res.status(StatusCode.OK).json({
        success: true,
        message: ResponseError.REJECT_INSTRUCTOR,
        data: approvedRequest,
      });
    } else {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Invalid request status" });
    }
  } catch (error: any) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
}
}
