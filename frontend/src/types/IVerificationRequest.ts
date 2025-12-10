export interface IVerificationRequest {
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}
