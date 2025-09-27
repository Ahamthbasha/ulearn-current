import { Types, Schema, Document } from "mongoose";
import mongoose from "mongoose";

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  discount: number;
  expiryDate: Date;
  status: boolean;
  usedBy: mongoose.Types.ObjectId[];
  minPurchase: number;
  maxDiscount: number;
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
  },

  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },

  expiryDate: {
    type: Date,
    required: true,
  },

  status: {
    type: Boolean,
    default: true,
  },

  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  minPurchase: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    required: true,
    min: 0,
  },
});

export const CouponModel = mongoose.model("coupons", CouponSchema);