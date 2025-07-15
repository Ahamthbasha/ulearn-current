import { Request, Response } from "express";

export interface IStudentSlotBookingController {
  initiateCheckout(req: Request, res: Response): Promise<void>;
  verifyPayment(req: Request, res: Response): Promise<void>;
  bookViaWallet(req: Request, res: Response): Promise<void>;
  getBookingHistory(req: Request, res: Response): Promise<void>;
  getBookingDetail(req:Request,res:Response):Promise<void>
  downloadReceipt(req:Request, res: Response): Promise<void>
}
