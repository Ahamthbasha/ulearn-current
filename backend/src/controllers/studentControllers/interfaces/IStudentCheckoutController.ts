import { Request, Response } from "express";

export interface IStudentCheckoutController {
  initiateCheckout(req: Request, res: Response): Promise<void>;
  completeCheckout(req: Request, res: Response): Promise<void>;
}
