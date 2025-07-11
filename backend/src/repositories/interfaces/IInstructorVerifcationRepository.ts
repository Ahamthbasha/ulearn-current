import { IVerificationModel } from "../../models/verificationModel";

export interface IInstructorVerificationRepository {
    sendVerifyRequest(username: string, email: string, degreeCertificateUrl: string, resumeUrl: string, status: string): Promise<IVerificationModel | null>;
    
    getRequestByEmail(email:string): Promise<IVerificationModel | null>;

    updateRequestByEmail(email:string,update:Partial<IVerificationModel>):Promise<IVerificationModel | null>
}
