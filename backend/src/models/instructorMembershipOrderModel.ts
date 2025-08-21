import { Schema, model, Types, Document } from "mongoose";

export interface IInstructorMembershipOrder extends Document {
  instructorId: Types.ObjectId;
  membershipPlanId: Types.ObjectId;
  price: number;
  paymentStatus: "pending" | "paid" | "failed";
  startDate: Date;
  endDate: Date;
  txnId: string;
  createdAt: Date;
}

export interface InstructorPopulated{
  username:string;
  email:string;
}

export interface MembershipPlanPopulated {
  name: string;
  durationInDays: number;
  description?: string;
  benefits?: string[];
}

export interface InstructorMembershipOrderDTO {
  instructor: {
    name: string;
    email: string;
  };
  membershipPlan: {
    name: string;
    durationInDays: number;
    description?:string;
    benefits?:string[];
  };
  price: number;
  paymentStatus: "pending" | "paid" | "failed";
  startDate: Date;
  endDate: Date;
  txnId: string;
  createdAt: Date;
}

export interface InstructorMembershipOrderListDTO {
  orderId: string;
  planName: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  purchaseDate: Date;
}



const InstructorMembershipOrderSchema = new Schema<IInstructorMembershipOrder>(
  {
    instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    membershipPlanId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", required: true },
    price: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    startDate: { type: Date },
    endDate: { type: Date },
    txnId: { type: String },
  },
  { timestamps: true }
);

export const InstructorMembershipOrderModel = model<IInstructorMembershipOrder>(
  "InstructorMembershipOrder",
  InstructorMembershipOrderSchema
);
