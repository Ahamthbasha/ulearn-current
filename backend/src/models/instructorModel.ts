import mongoose, { Document, ObjectId, Schema } from "mongoose";

export interface IInstructorDTO {
  username: string;
  email: string;
  password: string;
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
      required:false
    },
    skills: {
      type: [String],
      default: [],
    },
    expertise: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const InstructorModel = mongoose.model<IInstructor>("Instructor", instructorSchema);

export default InstructorModel;
