import mongoose, { Document, ObjectId, Schema } from "mongoose";
export interface IInstructorDTO {
  username: string;
  email: string;
  password: string;
}

export interface InstructorProfileDTO {
  _id: ObjectId;
  instructorName: string;
  email: string;
  role: string;
  isBlocked: boolean;
  skills?: string[];
  expertise?: string[];
  status: boolean; // isVerified
  mentor: boolean; // isMentor
  bankAccountLinked: boolean;
  profilePicUrl?: string;
}

export interface IInstructor extends Document {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  mobileNo?: string;
  profilePicUrl?: string;
  role: "instructor" | "mentor";
  isVerified: boolean;
  isBlocked: boolean;
  isMentor: boolean;
  skills?: string[];
  expertise?: string[];
  membershipExpiryDate?: Date;
  membershipPlanId?: mongoose.Types.ObjectId;
  bankAccount?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const instructorSchema: Schema<IInstructor> = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: String,
      required: false,
    },
    profilePicUrl: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["instructor", "mentor"],
      default: "instructor",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isMentor: {
      type: Boolean,
      default: false,
    },
    membershipExpiryDate: {
      type: Date,
    },
    membershipPlanId: {
      type: Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: false,
    },
    skills: {
      type: [String],
      default: [],
    },
    expertise: {
      type: [String],
      default: [],
    },
    bankAccount: {
      accountHolderName: { type: String, required: false },
      accountNumber: { type: String, required: false },
      ifscCode: { type: String, required: false },
      bankName: { type: String, required: false },
    },
  },
  { timestamps: true },
);

const InstructorModel = mongoose.model<IInstructor>(
  "Instructor",
  instructorSchema,
);

export default InstructorModel;
