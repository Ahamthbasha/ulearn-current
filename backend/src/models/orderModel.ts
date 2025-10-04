import { Schema, model, Document, Types } from "mongoose";

export interface ICourseOrderDetails {
  courseId: Types.ObjectId;
  courseName: string;
  coursePrice: number;
  thumbnailUrl: string;
  courseOfferPercentage?: number;
  offerPrice?: number;
  instructorId: Types.ObjectId; 
}

export interface ICouponDetails {
  couponId: Types.ObjectId;
  couponName: string;
  discountPercentage: number;
  discountAmount: number;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courses: ICourseOrderDetails[];
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  gateway: "razorpay" | "stripe";
  gatewayOrderId?: string;
  coupon?: ICouponDetails;
  createdAt: Date;
  updatedAt: Date;
}

const courseOrderDetailsSchema = new Schema<ICourseOrderDetails>({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  courseName: { type: String, required: true },
  coursePrice: { type: Number, required: true },
  thumbnailUrl: { type: String, required: true },
  courseOfferPercentage: { type: Number, required: false },
  offerPrice: { type: Number, required: false },
  instructorId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Added instructorId
}, { _id: false });

const couponDetailsSchema = new Schema<ICouponDetails>({
  couponId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
  couponName: { type: String, required: true },
  discountPercentage: { type: Number, required: true },
  discountAmount: { type: Number, required: true },
}, { _id: false });

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courses: [courseOrderDetailsSchema],
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    gateway: {
      type: String,
      enum: ["razorpay", "stripe"],
      default: "razorpay",
    },
    gatewayOrderId: { type: String, required: true },
    coupon: { type: couponDetailsSchema, required: false },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ userId: 1, "courses.courseId": 1, status: 1 });
orderSchema.index({ gatewayOrderId: 1 }, { unique: true });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const OrderModel = model<IOrder>("Order", orderSchema);