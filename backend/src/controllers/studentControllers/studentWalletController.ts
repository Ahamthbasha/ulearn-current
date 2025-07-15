import { Response } from 'express';
import { Types } from 'mongoose';
import { IWalletService } from '../../services/interface/IWalletService';
import { StatusCode } from '../../utils/enums';
import { AuthenticatedRequest } from '../../middlewares/AuthenticatedRoutes';
import { IStudentWalletController } from './interfaces/IStudentWalletController';

export class StudentWalletController implements IStudentWalletController{
    private walletService: IWalletService
  constructor(walletService: IWalletService) {
    this.walletService = walletService
  }

  async getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = new Types.ObjectId(req.user?.id);
      const wallet = await this.walletService.getWallet(ownerId);

      console.log(wallet)
      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch wallet',
      });
    }
  }

  async creditWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = new Types.ObjectId(req.user?.id);
      const { amount, description, txnId } = req.body;
      const wallet = await this.walletService.creditWallet(ownerId, amount, description, txnId);
      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to credit wallet',
      });
    }
  }

  async debitWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ownerId = new Types.ObjectId(req.user?.id);
      const { amount, description, txnId } = req.body;
      const wallet = await this.walletService.debitWallet(ownerId, amount, description, txnId);

      if (!wallet) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Insufficient balance or wallet not found',
        });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, wallet });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to debit wallet',
      });
    }
  }

  async getPaginatedTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const ownerId = new Types.ObjectId(req.user?.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;

    const { transactions, total } = await this.walletService.getPaginatedTransactions(
      ownerId,
      page,
      limit
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
      message: "Failed to fetch transactions",
    });
  }
}

}
