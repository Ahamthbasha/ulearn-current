// dto/AdminWalletDto.ts
import { Types } from "mongoose";

export interface WalletDto {
  ownerId: Types.ObjectId;
  balance: number;
}
