export interface ITransactionDTO {
  amount: number;
  type: "credit" | "debit";
  description: string;
  txnId: string;
  date: Date;
}

export interface ITransactionResponseDTO {
  amount: number;
  type: "credit" | "debit";
  description: string;
  txnId: string;
  date: string;
}
