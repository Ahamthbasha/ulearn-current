import { Response } from "express";
import { Types } from "mongoose";
import { IWalletService } from "../../services/interface/IWalletService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { IStudentWalletController } from "./interfaces/IStudentWalletController";
import { StudentErrorMessages } from "../../utils/constants";

export class StudentWalletController implements IStudentWalletController {
  private _walletService: IWalletService;
  constructor(walletService: IWalletService) {
    this._walletService = walletService;
  }

  async getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = new Types.ObjectId(req.user?.id);
      const wallet = await this._walletService.getWallet(ownerId);

      console.log(wallet);
      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_FETCH_WALLET,
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
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_CREDIT_WALLET,
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
            StudentErrorMessages.INSUFFICIENT_BALANCE_OR_WALLET_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_DEBIT_WALLET,
      });
    }
  }

  async getPaginatedTransactions(
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

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          transactions,
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_FETCH_TRANSACTIONS,
      });
    }
  }
}
