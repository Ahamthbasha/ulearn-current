import mongoose, { Document } from "mongoose";
import { Types } from "mongoose";
export interface IVerificationModel extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  resumeUrl: string;
  degreeCertificateUrl: string;
  status: string;
  reviewedAt: Date | null;
  rejectionReason?: string;
}

const verificationRequestSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    resumeUrl: { type: String, required: true },
    degreeCertificateUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true },
);

const VerificationModel = mongoose.model<IVerificationModel>(
  "VerificationRequests",
  verificationRequestSchema,
);

export default VerificationModel;
