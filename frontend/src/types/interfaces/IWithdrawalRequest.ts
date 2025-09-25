export interface IWithdrawalRequest {
  _id?: string;
  instructorName: string;
  date: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
}

export interface WithdrawalRequestDto {
  requestId: string;
  instructorName: string;
  instructorEmail: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  bankAccount: string;
}