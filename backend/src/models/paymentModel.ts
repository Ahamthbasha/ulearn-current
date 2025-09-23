import { Schema, model, Document, Types } from "mongoose";

export interface IPayment extends Document {
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  paymentId: string;
  status: "SUCCESS" | "FAILED";
  method: string;
  amount: number;
  receiptUrl?: string;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    paymentId: { type: String, required: true },
    status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
    method: { type: String, required: true },
    amount: { type: Number, required: true },
    receiptUrl: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

paymentSchema.index({ orderId: 1 }, { unique: true }); // One payment per order
paymentSchema.index({ paymentId: 1 }, { unique: true }); // Unique payment IDs
paymentSchema.index({ userId: 1, status: 1 }); // User payment history
paymentSchema.index({ createdAt: -1 }); // Payment history ordering

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
