import { Schema, model, Document, Types } from "mongoose";

interface ILearningPathCompletedCourse {
  courseId: Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface ILearningPathEnrollment extends Document {
  userId: Types.ObjectId;
  learningPathId: Types.ObjectId;
  enrolledAt: Date;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  certificateGenerated: boolean;
  certificateUrl?: string;
  unlockedOrder: number;
  completedCourses: ILearningPathCompletedCourse[];
}

const learningPathCompletedCourseSchema =
  new Schema<ILearningPathCompletedCourse>(
    {
      courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date },
    },
    { _id: false },
  );

const learningPathEnrollmentSchema = new Schema<ILearningPathEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    learningPathId: {
      type: Schema.Types.ObjectId,
      ref: "LearningPath",
      required: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    completionStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },
    certificateGenerated: { type: Boolean, default: false },
    certificateUrl: { type: String },
    unlockedOrder: { type: Number, default: 1 },
    completedCourses: {
      type: [learningPathCompletedCourseSchema],
      default: [],
    },
  },
  { timestamps: true },
);

learningPathEnrollmentSchema.index(
  { userId: 1, learningPathId: 1 },
  { unique: true },
);
learningPathEnrollmentSchema.index({ userId: 1 });
learningPathEnrollmentSchema.index({ learningPathId: 1 });
learningPathEnrollmentSchema.index({ completionStatus: 1 });

export const LearningPathEnrollmentModel = model<ILearningPathEnrollment>(
  "LearningPathEnrollment",
  learningPathEnrollmentSchema,
);
