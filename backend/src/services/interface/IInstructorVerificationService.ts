import { IVerificationModel } from "../../models/verificationModel";

export interface IInstructorVerificationService {
  sendVerifyRequest(username: string, email: string, degreeCertificateUrl: string, resumeUrl: string, status: string): Promise<IVerificationModel>;

  getRequestByEmail(email:string):Promise<IVerificationModel | null>

  reverifyRequest(username:string,email:string,degreeCertificateUrl:string,resumeUrl:string):Promise<IVerificationModel>
}
