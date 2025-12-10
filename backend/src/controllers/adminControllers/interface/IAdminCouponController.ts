import { Request, Response } from "express";

export interface IAdminCouponController {
  createCoupon(req: Request, res: Response): Promise<void>;
  getAllCoupons(req: Request, res: Response): Promise<void>;
  getCouponById(req: Request, res: Response): Promise<void>;
  getCouponByCode(req: Request, res: Response): Promise<void>;
  updateCoupon(req: Request, res: Response): Promise<void>;
  deleteCoupon(req: Request, res: Response): Promise<void>;
  toggleCouponStatus(req: Request, res: Response): Promise<void>;
}
