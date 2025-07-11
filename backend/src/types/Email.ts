import { SentMessageInfo } from "nodemailer"

export interface IEmail{
    sentEmailVerification(
        name:string,
        email:string,
        verification:string,
    ):Promise<boolean>
    sendMembershipPurchaseEmail(name: string, email: string, planName: string, expiryDate: Date): Promise<SentMessageInfo>;
  sendMembershipExpiryReminder(name: string, email: string, expiryDate: Date): Promise<SentMessageInfo>;
}

export interface IForgotEmail{
    sendEmailVerification(email:string,verification:string) : Promise<boolean>
}