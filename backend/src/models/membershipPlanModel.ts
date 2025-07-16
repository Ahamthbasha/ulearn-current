import { Schema, model, Document } from "mongoose";

export interface IMembershipPlan extends Document {
  _id:string;
  name: string;
  price: number;
  durationInDays: number;
  description?: string;
  benefits?: string[];
  isActive: boolean;
  createdAt: Date;
}

const MembershipPlanSchema = new Schema<IMembershipPlan>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  durationInDays: {
    type: Number,
    required: true,
    min: 1,
  },
  description: {
    type: String,
  },
  benefits: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const MembershipPlanModel = model<IMembershipPlan>(
  "MembershipPlan",
  MembershipPlanSchema
);
