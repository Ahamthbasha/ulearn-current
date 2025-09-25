import { Schema, model, Types, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IInstructorMembershipOrder extends Document {
  orderId: string;
  instructorId: Types.ObjectId;
  membershipPlanId: Types.ObjectId;
  price: number;
  paymentStatus: "pending" | "paid" | "failed" | "cancelled";
  startDate: Date;
  endDate: Date;
  razorpayOrderId: string;
  createdAt: Date;
}

export interface InstructorPopulated {
  username: string;
  email: string;
}

export interface MembershipPlanPopulated {
  name: string;
  durationInDays: number;
  description?: string;
  benefits?: string[];
}

export interface InstructorMembershipOrderDTO {
  orderId: string;
  instructor: {
    name: string;
    email: string;
  };
  membershipPlan: {
    name: string;
    durationInDays: number;
    description?: string;
    benefits?: string[];
  };
  price: number;
  paymentStatus: "pending" | "paid" | "failed" | "cancelled";
  startDate: Date;
  endDate: Date;
  razorpayOrderId: string;
  createdAt: Date;
}

export interface InstructorMembershipOrderListDTO {
  orderId: string;
  planName: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  purchaseDate: Date;
}

const InstructorMembershipOrderSchema = new Schema<IInstructorMembershipOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    membershipPlanId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    price: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    razorpayOrderId: { type: String, required: true },
  },
  { timestamps: true },
);

InstructorMembershipOrderSchema.index(
  { instructorId: 1, membershipPlanId: 1, paymentStatus: 1 },
  {
    unique: true,
    partialFilterExpression: { paymentStatus: { $in: ["pending", "paid"] } },
  },
);

export const InstructorMembershipOrderModel = model<IInstructorMembershipOrder>(
  "InstructorMembershipOrder",
  InstructorMembershipOrderSchema,
);
