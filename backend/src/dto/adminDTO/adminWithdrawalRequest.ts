export interface AdminWithdrawalRequestDTO {
  requestId: string;
  instructorName: string;
  instructorEmail: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  bankAccount: "Linked" | "Not Linked";
  createdAt: string; // formatted date
  reason?:string;
}
