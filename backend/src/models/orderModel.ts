import { Schema, model, Document, Types } from "mongoose";

export interface ICourseOrderDetails {
  courseId: Types.ObjectId;
  courseName: string;
  coursePrice: number;
  thumbnailUrl: string;
  courseOfferPercentage?: number;
  offerPrice?: number;
  instructorId: Types.ObjectId;
  isAlreadyEnrolled?: boolean;
}

export interface ILearningPathOrderDetails {
  learningPathId: Types.ObjectId;
  learningPathName: string;
  totalPrice: number;
  thumbnailUrl: string;
  offerPercentage?: number;
  offerPrice?: number;
  courses: ICourseOrderDetails[];
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
  learningPaths: ILearningPathOrderDetails[];
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  gateway: "razorpay" | "stripe" | "wallet";
  gatewayOrderId?: string;
  paymentId?: string;
  paymentStatus?: "SUCCESS" | "FAILED";
  paymentMethod?: string;
  paymentAmount?: number;
  paymentCreatedAt?: Date;
  coupon?: ICouponDetails;
  createdAt: Date;
  updatedAt: Date;
}

const courseOrderDetailsSchema = new Schema<ICourseOrderDetails>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    courseName: { type: String, required: true },
    coursePrice: { type: Number, required: true },
    thumbnailUrl: { type: String, required: true },
    courseOfferPercentage: { type: Number, required: false },
    offerPrice: { type: Number, required: false },
    instructorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isAlreadyEnrolled: { type: Boolean, default: false },
  },
  { _id: false },
);

const learningPathOrderDetailsSchema = new Schema<ILearningPathOrderDetails>(
  {
    learningPathId: {
      type: Schema.Types.ObjectId,
      ref: "LearningPath",
      required: true,
    },
    learningPathName: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    thumbnailUrl: { type: String, required: true },
    offerPercentage: { type: Number, required: false },
    offerPrice: { type: Number, required: false },
    courses: [courseOrderDetailsSchema],
  },
  { _id: false },
);

const couponDetailsSchema = new Schema<ICouponDetails>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
    couponName: { type: String, required: true },
    discountPercentage: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courses: [courseOrderDetailsSchema],
    learningPaths: [learningPathOrderDetailsSchema],
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    gateway: {
      type: String,
      enum: ["razorpay", "stripe", "wallet"],
      default: "razorpay",
    },
    gatewayOrderId: { type: String },
    paymentId: { type: String },
    paymentStatus: { type: String, enum: ["SUCCESS", "FAILED"] },
    paymentMethod: { type: String },
    paymentAmount: { type: Number },
    paymentCreatedAt: { type: Date },
    coupon: { type: couponDetailsSchema, required: false },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ userId: 1, "courses.courseId": 1, status: 1 });
orderSchema.index({ "learningPaths.learningPathId": 1 });
orderSchema.index({ gatewayOrderId: 1 }, { unique: true, sparse: true });
orderSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const OrderModel = model<IOrder>("Order", orderSchema);
