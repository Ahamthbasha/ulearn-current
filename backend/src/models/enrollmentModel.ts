import { Schema, model, Document, Types } from "mongoose";

interface ICompletedChapter {
  chapterId: Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
}

interface ICompletedQuiz {
  quizId: Types.ObjectId;
  correctAnswers: number;
  totalQuestions: number;
  scorePercentage: number;
  attemptedAt: Date;
}

export interface IEnrollment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrolledAt: Date;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  certificateGenerated: boolean;
  certificateUrl?: string;
  completedChapters: ICompletedChapter[];
  completedQuizzes: ICompletedQuiz[];
  
}

const completedChapterSchema = new Schema<ICompletedChapter>({
  chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { _id: false });

const completedQuizSchema = new Schema<ICompletedQuiz>({
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  correctAnswers: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  scorePercentage: { type: Number, required: true },
  attemptedAt: { type: Date, default: Date.now },
}, { _id: false });

const enrollmentSchema = new Schema<IEnrollment>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
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
}, { timestamps: false });

export const EnrollmentModel = model<IEnrollment>("Enrollment", enrollmentSchema);
