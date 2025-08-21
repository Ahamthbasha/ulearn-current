import mongoose, { Schema, Document, Types } from "mongoose";
import { IInstructor } from "./instructorModel";
export interface WithdrawalRequestListDTO {
  _id: string;
  instructorName: string;
  date: Date;
  amount: number;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
}
export interface IWithdrawalRequest extends Document {
  instructorId: Types.ObjectId | IInstructor;
  amount: number;
  bankAccount: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  status: "pending" | "approved" | "rejected";
  adminId?: Types.ObjectId; // ID of the admin who processes the request
  remarks?: string; // Optional remarks for approval/rejection
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema: Schema<IWithdrawalRequest> = new Schema(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be positive"],
    },
    bankAccount: {
      accountHolderName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    remarks: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

const WithdrawalRequestModel = mongoose.model<IWithdrawalRequest>(
  "WithdrawalRequest",
  WithdrawalRequestSchema,
);
export default WithdrawalRequestModel;
