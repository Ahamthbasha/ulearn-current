import { IInstructorVerificationService } from "../interface/IInstructorVerificationService";
import { IVerificationModel } from "../../models/verificationModel";
import { IInstructorVerificationRepository } from "../../repositories/interfaces/IInstructorVerifcationRepository";
import { VerificationErrorMessages } from "../../utils/constants";

export class InstructorVerificationService implements IInstructorVerificationService {
  private verificationRepository: IInstructorVerificationRepository;

  constructor(verificationRepository: IInstructorVerificationRepository) {
    this.verificationRepository = verificationRepository;
  }

  async sendVerifyRequest(
    username: string,
    email: string,
    degreeCertificateUrl: string,
    resumeUrl: string,
    status: string
  ): Promise<IVerificationModel> {
    const result = await this.verificationRepository.sendVerifyRequest(username, email, degreeCertificateUrl, resumeUrl, status);
    if (!result) {
      throw new Error(VerificationErrorMessages.VERIFICATION_REQUEST_FAILED);
    }
    return result;
  }

async getRequestByEmail(email: string): Promise<IVerificationModel | null> {
  return await this.verificationRepository.getRequestByEmail(email);
}

async reverifyRequest(username: string, email: string, degreeCertificateUrl: string, resumeUrl: string): Promise<IVerificationModel> {
    const updated = await this.verificationRepository.updateRequestByEmail(email,{username,degreeCertificateUrl,resumeUrl,status:'pending',rejectionReason:undefined,reviewedAt:null})

    if(!updated){
      throw new Error("Failed to update verification request")
    }

    return updated
}
}
