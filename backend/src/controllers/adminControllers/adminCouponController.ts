import { Request, Response } from "express";
import { IAdminCouponService } from "../../services/adminServices/interface/IAdminCouponService";
import { IAdminCouponController } from "./interface/IAdminCouponController";
import { StatusCode } from "../../utils/enums";
import { COUPONMESSAGE } from "../../utils/constants";
import { adminCouponDto } from "../../dto/adminDTO/adminCouponDTO";
import { ICoupon } from "../../models/couponModel";
import { appLogger } from "../../utils/logger";
import { ICouponResponse,ICouponsResponse,IDeleteCouponResponse } from "../../interface/adminInterface/IadminInterface";

export class AdminCouponController implements IAdminCouponController {
  private _couponService: IAdminCouponService;

  constructor(couponService: IAdminCouponService) {
    this._couponService = couponService;
  }

  async createCoupon(req: Request, res: Response): Promise<void> {
    try {
      const couponData: Partial<ICoupon> = req.body;
      const coupon: adminCouponDto = await this._couponService.createCoupon(couponData);
      res.status(StatusCode.CREATED).json({
        success: true,
        data: coupon,
      } as ICouponResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : COUPONMESSAGE.COUPON_CREATION_FAILED;
      appLogger.error("Create coupon error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as ICouponResponse);
    }
  }

  async getAllCoupons(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const searchCode = req.query.search as string || "";
      const result = await this._couponService.getAllCoupons(page, limit, searchCode);
      res.status(StatusCode.OK).json({
        success: true,
        data: result,
        pagination: {
          currentPage: page,
          limit: limit,
          totalPages: Math.ceil(result.total / limit),
          totalItems: result.total,
        },
      } as ICouponsResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : COUPONMESSAGE.COUPON_FETCH_FAILED;
      appLogger.error("Get all coupons error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as ICouponResponse); 
    }
  }

  async getCouponById(req: Request, res: Response): Promise<void> {
    try {
      const coupon: adminCouponDto | null = await this._couponService.getCouponById(req.params.couponId);
      if (!coupon) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: COUPONMESSAGE.COUPON_NOT_FOUND,
        } as ICouponResponse);
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        data: coupon,
      } as ICouponResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : COUPONMESSAGE.COUPON_NOT_FOUND;
      appLogger.error("Get coupon by ID error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as ICouponResponse);
    }
  }

  async getCouponByCode(req: Request, res: Response): Promise<void> {
    try {
      const coupon: adminCouponDto | null = await this._couponService.getCouponByCode(req.params.code);
      if (!coupon) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: COUPONMESSAGE.COUPON_NOT_FOUND,
        } as ICouponResponse);
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        data: coupon,
      } as ICouponResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : COUPONMESSAGE.COUPON_NOT_FOUND;
      appLogger.error("Get coupon by code error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as ICouponResponse);
    }
  }

  async updateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const coupon: adminCouponDto | null = await this._couponService.updateCoupon(req.params.couponId, req.body);
      if (!coupon) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: COUPONMESSAGE.COUPON_NOT_FOUND,
        } as ICouponResponse);
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        data: coupon,
      } as ICouponResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : COUPONMESSAGE.COUPON_UPDATE_FAILED;
      appLogger.error("Update coupon error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as ICouponResponse);
    }
  }

  async deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
      const success = await this._couponService.deleteCoupon(req.params.couponId);
      if (!success) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: COUPONMESSAGE.COUPON_NOT_FOUND,
        } as IDeleteCouponResponse);
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        message: COUPONMESSAGE.COUPON_DELETED_SUCCESSFULLY,
      } as IDeleteCouponResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : COUPONMESSAGE.COUPON_DELETION_FAILED;
      appLogger.error("Delete coupon error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as IDeleteCouponResponse);
    }
  }

  async toggleCouponStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      const coupon: adminCouponDto | null = await this._couponService.toggleCouponStatus(req.params.couponId, status);
      if (!coupon) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: COUPONMESSAGE.COUPON_NOT_FOUND,
        } as ICouponResponse);
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        data: coupon,
      } as ICouponResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : COUPONMESSAGE.COUPON_STATUS_TOGGLE_FAILED;
      appLogger.error("Toggle coupon status error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as ICouponResponse);
    }
  }
}