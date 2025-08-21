import { Types } from "mongoose";
import { IWallet } from "../../models/walletModel";
import { WalletDto } from "../../dto/common/walletDTO";

export interface IWalletService {
  getWallet(ownerId: Types.ObjectId): Promise<WalletDto | null>;
  creditWallet(
    ownerId: Types.ObjectId,
    amount: number,
    description: string,
    txnId: string,
  ): Promise<IWallet | null>;
  debitWallet(
    ownerId: string | Types.ObjectId,
    amount: number,
    description: string,
    txnId: string,
  ): Promise<IWallet | null>;
  initializeWallet(
    ownerId: Types.ObjectId,
    onModel: string,
    role: string,
  ): Promise<IWallet>;

  creditAdminWalletByEmail(
    email: string,
    amount: number,
    description: string,
    tnxId: string,
  ): Promise<void>;
  getPaginatedTransactions(
    ownerId: Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<{ transactions: IWallet["transactions"]; total: number }>;
  getAdminWalletByEmail(email: string): Promise<IWallet | null>;
}
