import { IWalletService } from './interface/IWalletService';
import { IWalletRepository } from '../repositories/interfaces/IWalletRepository';
import { IAdminRepository } from '../repositories/interfaces/IAdminRepository';
import { IWallet } from '../models/walletModel';
import { Types } from 'mongoose';

export class WalletService implements IWalletService {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly adminRepository: IAdminRepository // ✅ injected here
  ) {}

  async getWallet(ownerId: Types.ObjectId): Promise<IWallet | null> {
    return this.walletRepository.findByOwnerId(ownerId);
  }

  async creditWallet(ownerId: Types.ObjectId, amount: number, description: string, txnId: string): Promise<IWallet | null> {
    return this.walletRepository.creditWallet(ownerId, amount, description, txnId);
  }

  async debitWallet(
  ownerId: string | Types.ObjectId,
  amount: number,
  description: string,
  txnId: string
): Promise<IWallet | null> {
  const objectId = typeof ownerId === 'string' ? new Types.ObjectId(ownerId) : ownerId;

  return this.walletRepository.debitWallet(objectId, amount, description, txnId);
}


  async initializeWallet(
    ownerId: Types.ObjectId,
    onModel: 'User' | 'Instructor' | 'Admin',
    role: 'student' | 'instructor' | 'admin'
  ): Promise<IWallet> {
    return this.walletRepository.createWallet(ownerId, onModel, role);
  }

async creditAdminWalletByEmail(
  email: string,
  amount: number,
  description: string,
  txnId: string
): Promise<void> {
  const admin = await this.adminRepository.getAdmin(email);

  console.log('admin info',admin)

  if (!admin) throw new Error("Admin not found");

  const adminId = admin._id;
  console.log('admin id',adminId)
  let adminWallet = await this.walletRepository.findByOwnerId(adminId);
  if (!adminWallet) {
    console.warn("No wallet found for admin — creating new one!");
    adminWallet = await this.walletRepository.createWallet(adminId, 'Admin', admin.role);
  }

  await this.walletRepository.creditWallet(adminId, amount, description, txnId);
}

async getPaginatedTransactions(ownerId: Types.ObjectId, page: number, limit: number) {
  return this.walletRepository.getPaginatedTransactions(ownerId, page, limit);
}

async getAdminWalletByEmail(email: string): Promise<IWallet | null> {
  const admin = await this.adminRepository.getAdmin(email);
  if (!admin) return null;
  return this.walletRepository.findByOwnerId(admin._id);
}

}
