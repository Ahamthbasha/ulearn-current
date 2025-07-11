import { IVerificationModel } from "../../models/verificationModel";
import { GenericRepository } from "../genericRepository";
import VerificationModel from "../../models/verificationModel";
import { IInstructorVerificationRepository } from "../interfaces/IInstructorVerifcationRepository";

export class InstructorVerificationRepository extends GenericRepository<IVerificationModel> implements IInstructorVerificationRepository {
    constructor() {
        super(VerificationModel);
    }

    async sendVerifyRequest(username: string, email: string, degreeCertificateUrl: string, resumeUrl: string, status: string): Promise<IVerificationModel | null> {
        try {
            return await this.create({ username, email, degreeCertificateUrl, resumeUrl, status });
        } catch (error) {
            throw error;
        }
    }

    async getRequestByEmail(email: string): Promise<IVerificationModel | null> {
    try {
      return await this.findOne({ email });
    } catch (error) {
    throw error;
  }
}

async updateRequestByEmail(email: string, update: Partial<IVerificationModel>): Promise<IVerificationModel | null> {
    return await VerificationModel.findOneAndUpdate({email},{$set:update},{new:true})
}
}