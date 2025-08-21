
export interface WithdrawalRequestDetailDTO {
  requestId: string;
  instructorName: string;
  instructorEmail: string;
  amount: number;
  requestDate: Date;
  bankAccountLinked: "Linked" | "Not Linked";
  remarks?: string;
}
