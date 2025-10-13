import { Schema, model, Document, Types } from "mongoose";
import { ChapterModel } from "./chapterModel";

export interface ICompletedChapter {
  chapterId: Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface ICompletedQuiz {
  quizId: Types.ObjectId;
  correctAnswers: number;
  totalQuestions: number;
  scorePercentage: number;
  attemptedAt: Date;
}

export interface IEnrollment extends Document {
  _id:Types.ObjectId
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  learningPathId?: Types.ObjectId;
  enrolledAt: Date;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  certificateGenerated: boolean;
  certificateUrl?: string;
  completedChapters: ICompletedChapter[];
  completedQuizzes: ICompletedQuiz[];
  completionPercentage: number;
  createdAt:Date;
  updatedAt:Date;
}

const completedChapterSchema = new Schema<ICompletedChapter>(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false },
);

const completedQuizSchema = new Schema<ICompletedQuiz>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    correctAnswers: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    scorePercentage: { type: Number, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    learningPathId: { type: Schema.Types.ObjectId, ref: "LearningPath", required: false },
    enrolledAt: { type: Date, default: Date.now },
    completionStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },
    certificateGenerated: { type: Boolean, default: false },
    certificateUrl: { type: String },
    completedChapters: { type: [completedChapterSchema], default: [] },
    completedQuizzes: { type: [completedQuizSchema], default: [] },
    completionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Pre-save middleware to calculate completionPercentage
enrollmentSchema.pre("save", async function (next) {
  if (this.isModified("completedChapters") || this.isNew) {
    try {
      // Count total chapters for this course
      const totalChapters = await ChapterModel.countDocuments({
        courseId: this.courseId,
      });
      // Count completed chapters with isCompleted: true
      const completedChaptersCount = this.completedChapters.filter(
        (ch) => ch.isCompleted,
      ).length;
      // Calculate percentage
      this.completionPercentage =
        totalChapters > 0
          ? Math.round((completedChaptersCount / totalChapters) * 100)
          : 0;
      // Update completionStatus based on completionPercentage
      if (this.completionPercentage === 100) {
        this.completionStatus = "COMPLETED";
      } else if (this.completionPercentage > 0) {
        this.completionStatus = "IN_PROGRESS";
      } else {
        this.completionStatus = "NOT_STARTED";
      }
    } catch (error) {
      console.error("Error calculating completion percentage:", error);
      next(error as Error);
      return;
    }
  }
  next();
});

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ completionStatus: 1 });

export const EnrollmentModel = model<IEnrollment>("Enrollment", enrollmentSchema);