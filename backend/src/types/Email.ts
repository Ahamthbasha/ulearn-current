import { SentMessageInfo } from "nodemailer";

export interface IEmail {
  sentEmailVerification(
    name: string,
    email: string,
    verification: string,
  ): Promise<SentMessageInfo>;
  
  sendRejectionEmail(
    name: string,
    email: string,
    reason: string,
  ): Promise<SentMessageInfo>;
  
  sendVerificationSuccessEmail(
    name: string,
    email: string,
  ): Promise<SentMessageInfo>;
  
  sendMembershipPurchaseEmail(
    name: string,
    email: string,
    planName: string,
    expiryDate: Date,
  ): Promise<SentMessageInfo>;
  
  sendMembershipExpiryReminder(
    name: string,
    email: string,
    expiryDate: Date,
  ): Promise<SentMessageInfo>;
  
  sendSlotBookingConfirmation(
    name: string,
    email: string,
    instructorName: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<SentMessageInfo>;
}

export interface IForgotEmail {
  sendEmailVerification(email: string, verification: string): Promise<boolean>;
}