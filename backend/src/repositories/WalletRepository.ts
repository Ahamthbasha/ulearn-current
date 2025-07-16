import { IWalletRepository } from "./interfaces/IWalletRepository";
import WalletModel, { IWallet } from "../models/walletModel";
import { Types } from "mongoose";
import { GenericRepository } from "./genericRepository";

export class WalletRepository
  extends GenericRepository<IWallet>
  implements IWalletRepository
{
  constructor() {
    super(WalletModel);
  }
  async findByOwnerId(ownerId: Types.ObjectId): Promise<IWallet | null> {
    return await this.findOne({ ownerId });
  }

  async createWallet(
    ownerId: Types.ObjectId,
    onModel: string,
    role: string
  ): Promise<IWallet> {
    const wallet = new WalletModel({ ownerId, onModel, role });
    return wallet.save();
  }

  async creditWallet(
    ownerId: Types.ObjectId,
    amount: number,
    description: string,
    txnId: string
  ): Promise<IWallet | null> {
    return await this.findOneAndUpdate(
      { ownerId },
      {
        $inc: { balance: amount },
        $push: {
          transactions: {
            amount,
            type: "credit",
            description,
            txnId,
            date: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  async debitWallet(
    ownerId: Types.ObjectId,
    amount: number,
    description: string,
    txnId: string
  ): Promise<IWallet | null> {
    const wallet = await this.findOne({ ownerId });
    if (!wallet || wallet.balance < amount) return null;

    return await this.findOneAndUpdate(
      { ownerId },
      {
        $inc: { balance: -amount },
        $push: {
          transactions: {
            amount,
            type: "debit",
            description,
            txnId,
            date: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  async getPaginatedTransactions(
    ownerId: Types.ObjectId,
    page: number,
    limit: number
  ): Promise<{ transactions: IWallet["transactions"]; total: number }> {
    const wallet = await WalletModel.findOne({ ownerId });

    if (!wallet) return { transactions: [], total: 0 };

    const total = wallet.transactions.length;

    const transactions = wallet.transactions
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Newest first
      .slice((page - 1) * limit, page * limit);

    return { transactions, total };
  }
}
