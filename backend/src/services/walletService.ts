import { IWalletService } from "./interface/IWalletService";
import { IWalletRepository } from "../repositories/interfaces/IWalletRepository";
import { IAdminRepository } from "../repositories/adminRepository/interface/IAdminRepository";
import { IWallet } from "../models/walletModel";
import { Types } from "mongoose";
import { WalletDto } from "../dto/common/walletDTO";
import { toWalletDto } from "../mappers/common/walletMapper";

export class WalletService implements IWalletService {
  private _walletRepository: IWalletRepository;
  private _adminRepository: IAdminRepository;
  constructor(
    walletRepository: IWalletRepository,
    adminRepository: IAdminRepository,
  ) {
    this._walletRepository = walletRepository;
    this._adminRepository = adminRepository;
  }

  async getWallet(ownerId: Types.ObjectId): Promise<WalletDto | null> {
    const wallet = await this._walletRepository.findByOwnerId(ownerId);
    return wallet ? toWalletDto(wallet) : null;
  }

  async creditWallet(
    ownerId: Types.ObjectId,
    amount: number,
    description: string,
    txnId: string,
  ): Promise<IWallet | null> {
    return this._walletRepository.creditWallet(
      ownerId,
      amount,
      description,
      txnId,
    );
  }

  async debitWallet(
    ownerId: string | Types.ObjectId,
    amount: number,
    description: string,
    txnId: string,
  ): Promise<IWallet | null> {
    const objectId =
      typeof ownerId === "string" ? new Types.ObjectId(ownerId) : ownerId;

    return this._walletRepository.debitWallet(
      objectId,
      amount,
      description,
      txnId,
    );
  }

  async initializeWallet(
    ownerId: Types.ObjectId,
    onModel: "User" | "Instructor" | "Admin",
    role: "student" | "instructor" | "admin",
  ): Promise<IWallet> {
    return this._walletRepository.createWallet(ownerId, onModel, role);
  }

  async creditAdminWalletByEmail(
    email: string,
    amount: number,
    description: string,
    txnId: string,
  ): Promise<void> {
    const admin = await this._adminRepository.getAdmin(email);

    console.log("admin info", admin);

    if (!admin) throw new Error("Admin not found");

    const adminId = admin._id;
    console.log("admin id", adminId);
    let adminWallet = await this._walletRepository.findByOwnerId(adminId);
    if (!adminWallet) {
      console.warn("No wallet found for admin — creating new one!");
      adminWallet = await this._walletRepository.createWallet(
        adminId,
        "Admin",
        admin.role,
      );
    }

    await this._walletRepository.creditWallet(
      adminId,
      amount,
      description,
      txnId,
    );
  }

  async getPaginatedTransactions(
    ownerId: Types.ObjectId,
    page: number,
    limit: number,
  ) {
    return this._walletRepository.getPaginatedTransactions(
      ownerId,
      page,
      limit,
    );
  }

  async getAdminWalletByEmail(email: string): Promise<IWallet | null> {
    const admin = await this._adminRepository.getAdmin(email);
    if (!admin) return null;
    return this._walletRepository.findByOwnerId(admin._id);
  }
}
