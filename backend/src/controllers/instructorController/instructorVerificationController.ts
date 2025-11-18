import { Request, Response } from "express";
import { IInstructorVerificationService } from "../../services/instructorServices/interface/IInstructorVerificationService";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { StatusCode } from "../../utils/enums";
import {
  INSTRUCTOR_ERROR_MESSAGE,
  INSTRUCTOR_SUCCESS_MESSAGE,
  VerificationErrorMessages,
  VerificationSuccessMessages,
} from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import {
  BadRequestError,
} from "../../utils/error";
import { handleControllerError } from "../../utils/errorHandlerUtil";
export class InstructorVerificationController {
  private _verificationService: IInstructorVerificationService;
  
  constructor(verificationService: IInstructorVerificationService) {
    this._verificationService = verificationService;
  }

  async submitRequest(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;

      if (!req.files || typeof req.files !== "object") {
        throw new BadRequestError(VerificationErrorMessages.DOCUMENTS_MISSING);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const degreeCertificate = files.degreeCertificate?.[0] || null;
      const resume = files.resume?.[0] || null;

      if (!degreeCertificate || !resume) {
        throw new BadRequestError(
          VerificationErrorMessages.NO_DOCUMENTS_RECEIVED
        );
      }

      const existingRequest =
        await this._verificationService.getRequestByEmail(email);

      const degreeCertificateUrl = await uploadToS3Bucket(
        degreeCertificate,
        "degreeCertificate",
      );
      const resumeUrl = await uploadToS3Bucket(resume, "resume");

      if (existingRequest) {
        const currentStatus = existingRequest.status;

        if (currentStatus === "pending") {
          throw new BadRequestError(
            INSTRUCTOR_ERROR_MESSAGE.VERIFICATION_ALREADY_SUBMITTED
          );
        }

        if (currentStatus === "approved") {
          throw new BadRequestError(
            INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_ALREADY_VERIFIED
          );
        }

        const updatedRequest = await this._verificationService.reverifyRequest(
          name,
          email,
          degreeCertificateUrl,
          resumeUrl,
        );

        res.status(StatusCode.OK).send({
          success: true,
          message: INSTRUCTOR_SUCCESS_MESSAGE.REVIFICATION_SUBMITTED,
          data: updatedRequest,
        });
        return;
      }

      const newRequest = await this._verificationService.sendVerifyRequest(
        name,
        email,
        degreeCertificateUrl,
        resumeUrl,
        "pending",
      );

      res.status(StatusCode.OK).send({
        success: true,
        message: VerificationSuccessMessages.VERIFICATION_REQUEST_SENT,
        data: newRequest,
      });
    } catch (error) {
      appLogger.error("Verification error", { error });
      handleControllerError(error, res);
    }
  }

  async getRequestByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      const result = await this._verificationService.getRequestByEmail(email);

      res.status(StatusCode.OK).json({
        success: true,
        message: VerificationSuccessMessages.REQUEST_DATA_FETCHED,
        data: result,
      });
    } catch (error) {
      appLogger.error("Get request by email error", { error });
      handleControllerError(error, res);
    }
  }
}