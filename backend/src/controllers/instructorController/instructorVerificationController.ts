import { Request, Response } from 'express';
import { IInstructorVerificationService } from '../../services/interface/IInstructorVerificationService';
import { uploadToS3Bucket } from '../../utils/s3Bucket';
import { StatusCode } from '../../utils/enums';
import { VerificationErrorMessages, VerificationSuccessMessages } from '../../utils/constants';

export class InstructorVerificationController {
  private verificationService: IInstructorVerificationService;

  constructor(verificationService: IInstructorVerificationService) {
    this.verificationService = verificationService;
  }

  async submitRequest(req: Request, res: Response): Promise<void> {
  try {
    const { name, email } = req.body;

    console.log('body',req.body)
    console.log('Files',req.files || req.file)

    if (!req.files || typeof req.files !== 'object') {
      throw new Error(VerificationErrorMessages.DOCUMENTS_MISSING);
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const degreeCertificate = files.degreeCertificate?.[0] || null;
    const resume = files.resume?.[0] || null;

    if (!degreeCertificate || !resume) {
      res.status(StatusCode.BAD_REQUEST).send({
        success: false,
        message: VerificationErrorMessages.NO_DOCUMENTS_RECEIVED
      });
      return
    }

    const existingRequest = await this.verificationService.getRequestByEmail(email);

    const degreeCertificateUrl = await uploadToS3Bucket(degreeCertificate, 'degreeCertificate');
    const resumeUrl = await uploadToS3Bucket(resume, 'resume');

    if (existingRequest) {
      const currentStatus = existingRequest.status;

      if (currentStatus === 'pending') {
        res.status(StatusCode.BAD_REQUEST).send({
          success: false,
          message: 'Verification already submitted and under review.'
        });
        return
      }

      if (currentStatus === 'approved') {
        res.status(StatusCode.BAD_REQUEST).send({
          success: false,
          message: 'You are already verified.'
        });
        return
      }

      // ✅ If rejected → allow re-verification (update the request)
      const updatedRequest = await this.verificationService.reverifyRequest(
        name,
        email,
        degreeCertificateUrl,
        resumeUrl
      );

      res.status(StatusCode.OK).send({
        success: true,
        message: 'Reverification submitted successfully.',
        data: updatedRequest
      });
      return
    }

    // 🔰 First-time submission
    const newRequest = await this.verificationService.sendVerifyRequest(
      name,
      email,
      degreeCertificateUrl,
      resumeUrl,
      'pending'
    );

    res.status(StatusCode.OK).send({
      success: true,
      message: VerificationSuccessMessages.VERIFICATION_REQUEST_SENT,
      data: newRequest
    });
  } catch (error: any) {
    console.log('verificationerror',error)
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
}


  async getRequestByEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.params;
    const result = await this.verificationService.getRequestByEmail(email);

    res.status(StatusCode.OK).json({
      success: true,
      message: VerificationSuccessMessages.REQUEST_DATA_FETCHED,
      data: result,
    });
  } catch (error: any) {
    console.log(error)
    res.status(StatusCode.NOT_FOUND).json({
      success: false,
      message: error.message,
    });
  }
}

}
