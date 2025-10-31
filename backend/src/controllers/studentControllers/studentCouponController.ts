import { Request, Response } from "express";
import { IStudentCouponService } from "../../services/studentServices/interface/IStudentCouponService";
import { IStudentCouponController } from "./interfaces/IStudentCouponController";
import { handleControllerError } from "../../utils/errorHandlerUtil";

export class StudentCouponController implements IStudentCouponController {
  private _couponService: IStudentCouponService;

  constructor(couponService: IStudentCouponService) {
    this._couponService = couponService;
  }

  async getAvailableCoupons(_req: Request, res: Response): Promise<void> {
    try {
      const coupons = await this._couponService.getAvailableCoupons();
      res.status(200).json({ success: true, data: coupons });
    } catch (error:unknown) {
      handleControllerError(error,res)
    }
  }
}
