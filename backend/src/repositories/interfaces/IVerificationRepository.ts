import { updateRequestType } from "../../types/types";
import { IVerificationModel } from "../../models/verificationModel";

export interface IVerificationRepository{
    sendVerifyRequest(username:string,email:string,degreeCertificateUrl:string,resumeUrl:string,status:string):Promise<IVerificationModel | null>,

    getRequestDataByEmail(email:string):Promise<IVerificationModel | null>,

    getAllRequests():Promise<IVerificationModel[] | null>,

    updateRequest(email:string,data:updateRequestType):Promise<IVerificationModel | null>

    approveRequest(email:string,status:string):Promise<IVerificationModel | null>
}