// mappers/walletMapper.ts
import { IWallet } from "../../models/walletModel";
import { WalletDto } from "../../dto/common/walletDTO";

export function toWalletDto(wallet: IWallet): WalletDto {
  return {
    ownerId: wallet.ownerId,
    balance: wallet.balance,
  };
}
