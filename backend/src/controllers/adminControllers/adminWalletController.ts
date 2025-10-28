import { Response } from "express";
import { Types } from "mongoose";
import { IWalletService } from "../../services/interface/IWalletService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IAdminWalletController } from "./interface/IAdminWalletController";
import { AdminErrorMessages } from "../../utils/constants";
import { appLogger } from "../../utils/logger";

export class AdminWalletController implements IAdminWalletController {
  private _walletService: IWalletService;
  constructor(walletService: IWalletService) {
    this._walletService = walletService;
  }

  async getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = new Types.ObjectId(req.user?.id);
      const wallet = await this._walletService.getWallet(ownerId);
      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error) {
      appLogger.error("admin getting wallet error", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.ADMIN_FAILED_TO_FETCH_WALLET,
      });
    }
  }

  async creditWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = new Types.ObjectId(req.user?.id);
      const { amount, description, txnId } = req.body;
      const wallet = await this._walletService.creditWallet(
        ownerId,
        amount,
        description,
        txnId,
      );
      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error) {
      appLogger.error("admin credit wallet error", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.ADMIN_FAILED_TO_CREDIT_WALLET,
      });
    }
  }

  async debitWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = new Types.ObjectId(req.user?.id);
      const { amount, description, txnId } = req.body;
      const wallet = await this._walletService.debitWallet(
        ownerId,
        amount,
        description,
        txnId,
      );

      if (!wallet) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message:
            AdminErrorMessages.ADMIN_INSUFFICIENT_BALANCE_WALLET_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error) {
      appLogger.error("admin debit wallet error", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.ADMIN_FAILED_TO_DEBIT_WALLET,
      });
    }
  }

  async getTransactions(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const ownerId = new Types.ObjectId(req.user?.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;

      const { transactions, total } =
        await this._walletService.getPaginatedTransactions(
          ownerId,
          page,
          limit,
        );

      const totalPages = Math.ceil(total / limit);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          transactions,
          currentPage: page,
          totalPages,
          total,
        },
      });
    } catch (error) {
      appLogger.error("Failed to fetch admin wallet transactions:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.ADMIN_FAILED_TO_FETCH_TRANSACTIONS,
      });
    }
  }
}
