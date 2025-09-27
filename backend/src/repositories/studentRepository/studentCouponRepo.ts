import { CouponModel, ICoupon } from "../../models/couponModel";
import { IStudentCouponRepo } from "./interface/IStudentCouponRepo";
import { GenericRepository } from "../genericRepository";

export class StudentCouponRepo extends GenericRepository<ICoupon> implements IStudentCouponRepo {
  constructor() {
    super(CouponModel);
  }

  async getAvailableCoupons(): Promise<ICoupon[]> {
    try {
      const currentDate = new Date();
      const coupons = await this.find({
        status: true,
        expiryDate: { $gte: currentDate },
      });
      return coupons;
    } catch (error: any) {
      throw new Error(`Failed to fetch available coupons: ${error.message}`);
    }
  }
}