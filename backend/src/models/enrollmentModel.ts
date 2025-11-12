import { Schema, model, Document, Types } from "mongoose";
import { appLogger } from "../utils/logger";
import { CourseModel } from "./courseModel";

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
  isPassed: boolean;
  attemptedAt: Date;
}

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const completedChapterSchema = new Schema<ICompletedChapter>(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const completedQuizSchema = new Schema<ICompletedQuiz>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    correctAnswers: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    scorePercentage: { type: Number, required: true },
    isPassed: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    learningPathId: { type: Schema.Types.ObjectId, ref: "LearningPath" },
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
  { timestamps: true }
);

// Udemy-Exact Progress — FIXED
enrollmentSchema.pre("save", async function (next) {
  if (
    this.isModified("completedChapters") ||
    this.isModified("completedQuizzes") ||
    this.isNew
  ) {
    try {
      const courseId = this.courseId;

      // Populate course with modules → chapters & quizzes
      const course = await CourseModel.findById(courseId)
        .populate({
          path: "modules",
          populate: [
            { path: "chapters", select: "_id" },
            { path: "quiz", select: "_id" }
          ]
        });

      if (!course || !course.modules) {
        this.completionPercentage = 0;
        this.completionStatus = "NOT_STARTED";
        return next();
      }

      const totalLectures = course.modules.reduce(
        (sum, m) => sum + (m.chapters?.length || 0),
        0
      );

      const totalQuizzes = course.modules.filter(m => m.quiz).length;

      const completedLectures = this.completedChapters.filter(c => c.isCompleted).length;
      const passedQuizzes = this.completedQuizzes.filter(q => q.isPassed).length;

      const totalItems = totalLectures + totalQuizzes;
      const completedItems = completedLectures + passedQuizzes;

      this.completionPercentage = totalItems > 0
        ? Math.round((completedItems / totalItems) * 100)
        : 0;

      this.completionStatus =
        this.completionPercentage === 100
          ? "COMPLETED"
          : this.completionPercentage > 0
            ? "IN_PROGRESS"
            : "NOT_STARTED";

    } catch (err) {
      appLogger.error("Enrollment pre-save error:", err);
      return next(err as Error);
    }
  }
  next();
});

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ courseId: 1 });

export const EnrollmentModel = model<IEnrollment>("Enrollment", enrollmentSchema);