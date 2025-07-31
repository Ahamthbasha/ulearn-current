
export interface IWithdrawalRequest {
  _id: string;
  instructorId: string ;
  amount: number;
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  adminId?: string;
  remarks?: string;
}