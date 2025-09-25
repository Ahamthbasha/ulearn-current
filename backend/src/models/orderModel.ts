import { Schema, model, Document, Types } from "mongoose";

export interface IOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courses: Types.ObjectId[];
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  gateway: "razorpay" | "stripe";
  gatewayOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course", required: true }],
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
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, status: 1 }); // Find pending orders by user
orderSchema.index({ userId: 1, courses: 1, status: 1 }); // Prevent duplicate course orders
orderSchema.index({ gatewayOrderId: 1 }, { unique: true }); // Prevent duplicate gateway orders
orderSchema.index({ status: 1, createdAt: -1 }); // Query orders by status
orderSchema.index({ createdAt: -1 }); // General ordering

export const OrderModel = model<IOrder>("Order", orderSchema);
