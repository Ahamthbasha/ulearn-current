import { Request, Response } from "express";
import { IAdminCouponService } from "../../services/adminServices/interface/IAdminCouponService";
import { IAdminCouponController } from "./interface/IAdminCouponController";
import { ICoupon } from "../../models/couponModel";
import { StatusCode } from "../../utils/enums";
import { COUPONMESSAGE } from "../../utils/constants";

export class AdminCouponController implements IAdminCouponController {
  private _couponService: IAdminCouponService;
  constructor(couponService: IAdminCouponService) {
    this._couponService = couponService;
  }

  async createCoupon(req: Request, res: Response): Promise<void> {
    try {
      const couponData: Partial<ICoupon> = req.body;
      const coupon = await this._couponService.createCoupon(couponData);
      res.status(StatusCode.CREATED).json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  async getAllCoupons(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const searchCode = req.query.search as string;
      const result = await this._couponService.getAllCoupons(
        page,
        limit,
        searchCode
      );
      res.status(StatusCode.OK).json({ success: true, data: result,
        pagination: {
          currentPage: page,
          limit: limit,
          totalPages: Math.ceil(result.total / limit),
          totalItems: result.total
        }
       });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  async getCouponById(req: Request, res: Response): Promise<void> {
    try {
      const coupon = await this._couponService.getCouponById(
        req.params.couponId
      );
      if (!coupon) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: COUPONMESSAGE.COUPON_NOT_FOUND });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  async getCouponByCode(req: Request, res: Response): Promise<void> {
    try {
      const coupon = await this._couponService.getCouponByCode(req.params.code);
      if (!coupon) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: COUPONMESSAGE.COUPON_NOT_FOUND });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  async updateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const coupon = await this._couponService.updateCoupon(
        req.params.couponId,
        req.body
      );
      if (!coupon) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: COUPONMESSAGE.COUPON_NOT_FOUND });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  async deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
      const success = await this._couponService.deleteCoupon(
        req.params.couponId
      );
      if (!success) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: COUPONMESSAGE.COUPON_NOT_FOUND });
        return;
      }
      res
        .status(StatusCode.OK)
        .json({ success: true, message: COUPONMESSAGE.COUPON_DELETED_SUCCESSFULLY });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }

  async toggleCouponStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      const coupon = await this._couponService.toggleCouponStatus(
        req.params.couponId,
        status
      );
      if (!coupon) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: COUPONMESSAGE.COUPON_NOT_FOUND });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: coupon });
    } catch (error: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    }
  }
}