import { Types } from "mongoose";
import { ICoupon } from "../../../models/couponModel";
import mongoose from "mongoose";

export interface IStudentCouponRepo {
  getAvailableCoupons(): Promise<ICoupon[]>;
  getCouponById(couponId: Types.ObjectId, session?: mongoose.ClientSession): Promise<ICoupon | null>;
  addUserToCoupon(couponId: Types.ObjectId, userId: Types.ObjectId, session?: mongoose.ClientSession): Promise<void>;
}