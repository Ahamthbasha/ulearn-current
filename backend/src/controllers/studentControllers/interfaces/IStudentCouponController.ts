import { Request, Response } from "express";

export interface IStudentCouponController {
  getAvailableCoupons(req: Request, res: Response): Promise<void>;
}