import { Schema, model, Document, Types } from "mongoose";


export interface IOrder extends Document {
  _id:Types.ObjectId,
  userId: Types.ObjectId ;
  courses: Types.ObjectId[] ;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  gateway: "razorpay" | "stripe";
  gatewayOrderId: string;
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
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    gateway: {
      type: String,
      enum: ["razorpay", "stripe"],
      default: "razorpay",
    },
    gatewayOrderId: { type: String, required: true },
  },
  { timestamps: true }
);

export const OrderModel = model<IOrder>("Order", orderSchema);
