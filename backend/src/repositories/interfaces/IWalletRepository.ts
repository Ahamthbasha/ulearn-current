import { Types } from "mongoose";
import { IWallet } from "../../models/walletModel";

export interface IWalletRepository {
  findByOwnerId(ownerId: Types.ObjectId): Promise<IWallet | null>;
  createWallet(
    ownerId: Types.ObjectId,
    onModel: string,
    role: string,
  ): Promise<IWallet>;
  creditWallet(
    ownerId: Types.ObjectId,
    amount: number,
    description: string,
    txnId: string,
    options?: { session?: import("mongoose").ClientSession }
  ): Promise<IWallet | null>;
  debitWallet(
    ownerId: Types.ObjectId,
    amount: number,
    description: string,
    txnId: string,
    options?: { session?: import("mongoose").ClientSession }
  ): Promise<IWallet | null>;

  getPaginatedTransactions(
    ownerId: Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<{ transactions: IWallet["transactions"]; total: number }>;
}