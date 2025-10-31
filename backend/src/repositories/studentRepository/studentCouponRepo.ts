import { Types, ClientSession } from "mongoose";
import { ICoupon, CouponModel } from "../../models/couponModel";
import { IStudentCouponRepo } from "./interface/IStudentCouponRepo";
import { GenericRepository } from "../genericRepository";

export class StudentCouponRepo
  extends GenericRepository<ICoupon>
  implements IStudentCouponRepo
{
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
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to fetch available coupons: ${errorMessage}`);
    }
  }

  async getCouponById(
    couponId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<ICoupon | null> {
    try {
      return await this.findById(couponId.toString(), session);
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to fetch coupon: ${errorMessage}`);
    }
  }

  async addUserToCoupon(
    couponId: Types.ObjectId,
    userId: Types.ObjectId,
    session?: ClientSession,
  ): Promise<void> {
    try {
      const update = { $push: { usedBy: userId } };
      const updatedCoupon = await this.findOneAndUpdate(
        { _id: couponId },
        update,
        { session, new: true },
      );
      if (!updatedCoupon) {
        throw new Error("Coupon not found");
      }
    } catch (error) {
      const errorMessage = error instanceof Error && error.message
      throw new Error(`Failed to update coupon usage: ${errorMessage}`);
    }
  }
}
