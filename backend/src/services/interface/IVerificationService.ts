import { IVerificationModel } from "../../models/verificationModel";
import { updateRequestType } from "../../types/types";

export interface IVerificationService {
  sendVerifyRequest(
    username: string,
    email: string,
    degreeCertificateUrl: string,
    resumeUrl: string,
    status : string
  ): Promise<IVerificationModel>;

  getRequestDataByEmail(email: string): Promise<IVerificationModel | null>;
  
  approveRequest(
    email: string,
    status: string,
  ): Promise<IVerificationModel | null>;
  
  getAllRequests(): Promise<IVerificationModel[] | null>;
  
  updateRequest(
    email: string,
    data: updateRequestType
  ): Promise<IVerificationModel | null>;
}