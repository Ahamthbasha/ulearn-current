import { Types } from "mongoose";
import { IAdminCouponRepo } from "../../repositories/adminRepository/interface/IAdminCouponRepo"; 
import { IAdminCouponService } from "./interface/IAdminCouponService"; 
import { ICoupon } from "../../models/couponModel";

export class AdminCouponService implements IAdminCouponService {
    private _couponRepo: IAdminCouponRepo
  constructor(couponRepo: IAdminCouponRepo) {
    this._couponRepo = couponRepo
  }

  async createCoupon(couponData: Partial<ICoupon>): Promise<ICoupon> {
    if (!couponData.code || !couponData.discount || !couponData.expiryDate) {
      throw new Error("Missing required coupon fields");
    }

    const existingCoupon = await this._couponRepo.getCouponByCode(couponData.code);
    if (existingCoupon) {
      throw new Error("Coupon code already exists");
    }

    if (couponData.discount < 0 || couponData.discount > 100) {
      throw new Error("Discount must be between 0 and 100");
    }

    if (new Date(couponData.expiryDate) < new Date()) {
      throw new Error("Expiry date must be in the future");
    }

    return await this._couponRepo.createCoupon(couponData);
  }

  async getAllCoupons(page: number, limit: number,searchCode?:string): Promise<{ coupons: ICoupon[], total: number }> {
    if (page < 1 || limit < 1) {
      throw new Error("Invalid pagination parameters");
    }
    return await this._couponRepo.getAllCoupons(page, limit,searchCode);
  }

  async getCouponById(id: string): Promise<ICoupon | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }
    return await this._couponRepo.getCouponById(new Types.ObjectId(id));
  }

  async getCouponByCode(code: string): Promise<ICoupon | null> {
    if (!code) {
      throw new Error("Coupon code is required");
    }
    return await this._couponRepo.getCouponByCode(code);
  }

  async updateCoupon(id: string, couponData: Partial<ICoupon>): Promise<ICoupon | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }

    if (couponData.discount && (couponData.discount < 0 || couponData.discount > 100)) {
      throw new Error("Discount must be between 0 and 100");
    }

    if (couponData.expiryDate && new Date(couponData.expiryDate) < new Date()) {
      throw new Error("Expiry date must be in the future");
    }

    if (couponData.code) {
      const existingCoupon = await this._couponRepo.getCouponByCode(couponData.code);
      if (existingCoupon && existingCoupon._id.toString() !== id) {
        throw new Error("Coupon code already exists");
      }
    }

    return await this._couponRepo.updateCoupon(new Types.ObjectId(id), couponData);
  }

  async deleteCoupon(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }
    return await this._couponRepo.deleteCoupon(new Types.ObjectId(id));
  }

  async toggleCouponStatus(id: string, status: boolean): Promise<ICoupon | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }
    return await this._couponRepo.toggleCouponStatus(new Types.ObjectId(id), status);
  }
}