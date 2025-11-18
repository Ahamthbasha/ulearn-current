import { Types } from "mongoose";
import { IAdminCouponRepo } from "../../repositories/adminRepository/interface/IAdminCouponRepo";
import { IAdminCouponService } from "./interface/IAdminCouponService";
import { ICoupon } from "../../models/couponModel";
import { adminCouponDto } from "../../dto/adminDTO/adminCouponDTO";
import {
  mapToCouponDto,
  mapToCouponListDto,
} from "../../mappers/adminMapper/adminCouponMapper";

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

    const expiryDate = new Date(couponData.expiryDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDateComparison = new Date(expiryDate);
    expiryDateComparison.setHours(0, 0, 0, 0);

    if (expiryDateComparison < today) {
      throw new Error("Expiry date must be in the future");
    }

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
    const existingCoupon = await this._couponRepo.getCouponById(new Types.ObjectId(id));
    if (!existingCoupon) {
      throw new Error("Coupon not found");
    }

    let newExpiryDate: Date | undefined;
    if (couponData.expiryDate) {
      newExpiryDate = new Date(couponData.expiryDate);
      const existingDate = new Date(existingCoupon.expiryDate);
      existingDate.setHours(0, 0, 0, 0);
      newExpiryDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
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