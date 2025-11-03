// AdminCouponService - CORRECTED VERSION

import { Types } from "mongoose";
import { IAdminCouponRepo } from "../../repositories/adminRepository/interface/IAdminCouponRepo";
import { IAdminCouponService } from "./interface/IAdminCouponService";
import { ICoupon } from "../../models/couponModel";
import { adminCouponDto } from "../../dto/adminDTO/adminCouponDTO";
import {
  mapToCouponDto,
  mapToCouponListDto,
} from "../../mappers/adminMapper/adminCouponMapper";

// CORRECTED: This function is NOT needed anymore since frontend sends YYYY-MM-DD
// Remove this or update it to handle YYYY-MM-DD format

export class AdminCouponService implements IAdminCouponService {
  private _couponRepo: IAdminCouponRepo;

  constructor(couponRepo: IAdminCouponRepo) {
    this._couponRepo = couponRepo;
  }

  async createCoupon(couponData: Partial<ICoupon>): Promise<adminCouponDto> {
    if (!couponData.code || !couponData.discount || !couponData.expiryDate) {
      throw new Error("Missing required coupon fields");
    }

    const existingCoupon = await this._couponRepo.getCouponByCode(
      couponData.code,
    );
    if (existingCoupon) {
      throw new Error("Coupon code already exists");
    }

    if (couponData.discount < 0 || couponData.discount > 100) {
      throw new Error("Discount must be between 0 and 100");
    }

    // CORRECTED: Frontend sends YYYY-MM-DD format, so just use new Date()
    const expiryDate = new Date(couponData.expiryDate);

    // Set time to end of day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDateComparison = new Date(expiryDate);
    expiryDateComparison.setHours(0, 0, 0, 0);

    if (expiryDateComparison < today) {
      throw new Error("Expiry date must be in the future");
    }

    // Store the parsed date
    const dataToSave = {
      ...couponData,
      expiryDate
    };

    const coupon = await this._couponRepo.createCoupon(dataToSave);
    return mapToCouponDto(coupon);
  }

  async getAllCoupons(
    page: number,
    limit: number,
    searchCode?: string,
  ): Promise<{ coupons: adminCouponDto[]; total: number }> {
    if (page < 1 || limit < 1) {
      throw new Error("Invalid pagination parameters");
    }
    const result = await this._couponRepo.getAllCoupons(
      page,
      limit,
      searchCode,
    );
    return {
      coupons: mapToCouponListDto(result.coupons),
      total: result.total,
    };
  }

  async getCouponById(id: string): Promise<adminCouponDto | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }
    const coupon = await this._couponRepo.getCouponById(new Types.ObjectId(id));
    return coupon ? mapToCouponDto(coupon) : null;
  }

  async getCouponByCode(code: string): Promise<adminCouponDto | null> {
    if (!code) {
      throw new Error("Coupon code is required");
    }
    const coupon = await this._couponRepo.getCouponByCode(code);
    return coupon ? mapToCouponDto(coupon) : null;
  }

  async updateCoupon(
    id: string,
    couponData: Partial<ICoupon>,
  ): Promise<adminCouponDto | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }

    if (
      couponData.discount &&
      (couponData.discount < 0 || couponData.discount > 100)
    ) {
      throw new Error("Discount must be between 0 and 100");
    }

    // Get existing coupon to compare dates
    const existingCoupon = await this._couponRepo.getCouponById(new Types.ObjectId(id));
    if (!existingCoupon) {
      throw new Error("Coupon not found");
    }

    // CORRECTED: Parse the new expiry date if provided
    let newExpiryDate: Date | undefined;
    if (couponData.expiryDate) {
      // Frontend sends YYYY-MM-DD, so just use new Date()
      newExpiryDate = new Date(couponData.expiryDate);

      // Only validate future date if the date has actually changed
      const existingDate = new Date(existingCoupon.expiryDate);
      existingDate.setHours(0, 0, 0, 0);
      newExpiryDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If date has changed and new date is in the past, reject it
      if (newExpiryDate.getTime() !== existingDate.getTime() && newExpiryDate < today) {
        throw new Error("Expiry date must be in the future");
      }
    }

    if (couponData.code) {
      const existingCouponByCode = await this._couponRepo.getCouponByCode(
        couponData.code,
      );
      if (existingCouponByCode && existingCouponByCode._id.toString() !== id) {
        throw new Error("Coupon code already exists");
      }
    }

    // Prepare update data with parsed date
    const updateData = {
      ...couponData,
      ...(newExpiryDate && { expiryDate: newExpiryDate })
    };

    const coupon = await this._couponRepo.updateCoupon(
      new Types.ObjectId(id),
      updateData,
    );
    return coupon ? mapToCouponDto(coupon) : null;
  }

  async deleteCoupon(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }
    return await this._couponRepo.deleteCoupon(new Types.ObjectId(id));
  }

  async toggleCouponStatus(
    id: string,
    status: boolean,
  ): Promise<adminCouponDto | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }
    const coupon = await this._couponRepo.toggleCouponStatus(
      new Types.ObjectId(id),
      status,
    );
    return coupon ? mapToCouponDto(coupon) : null;
  }
}