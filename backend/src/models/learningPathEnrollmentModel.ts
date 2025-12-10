import { Schema, model, Document, Types } from "mongoose";
import { EnrollmentModel } from "./enrollmentModel";

export interface ILearningPathCompletedCourse {
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
  unlockedCourses: Types.ObjectId[];
  completedCourses: ILearningPathCompletedCourse[];
}

const learningPathCompletedCourseSchema = new Schema<ILearningPathCompletedCourse>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const learningPathEnrollmentSchema = new Schema<ILearningPathEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    learningPathId: { type: Schema.Types.ObjectId, ref: "LearningPath", required: true },
    enrolledAt: { type: Date, default: Date.now },
    completionStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },
    certificateGenerated: { type: Boolean, default: false },
    certificateUrl: { type: String },
    unlockedOrder: { type: Number, default: 1 },
    unlockedCourses: {
      type: [{ type: Schema.Types.ObjectId, ref: "Course" }],
      default: [],
    },
    completedCourses: {
      type: [learningPathCompletedCourseSchema],
      default: [],
    },
  },
  { timestamps: true }
);

learningPathEnrollmentSchema.index({ userId: 1, learningPathId: 1 }, { unique: true });

// Define interface for LearningPath with minimal needed fields for type safety
interface ILearningPathItem {
  courseId: Types.ObjectId;
  order: number;
}

interface ILearningPath {
  items: ILearningPathItem[];
}


// PRE-SAVE HOOK: Sync pre-completed courses on enrollment creation
learningPathEnrollmentSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    // Use explicit typing and lean() for better type inference
    const learningPathDoc = await model<ILearningPath>("LearningPath")
      .findById(this.learningPathId)
      .lean()
      .exec();

    if (!learningPathDoc || !Array.isArray(learningPathDoc.items) || learningPathDoc.items.length === 0) {
      // No learning path or items to process
      return next();
    }

    // Sort items by order
    const sortedItems = [...learningPathDoc.items].sort((a, b) => a.order - b.order);
    const courseIds = sortedItems.map((i) => i.courseId);

    // Find completed enrollments for user among these courses
    const completedEnrollments = await EnrollmentModel.find({
      userId: this.userId,
      courseId: { $in: courseIds },
      completionStatus: "COMPLETED",
    }).lean();

    const completedMap = new Map<string, true>(
      completedEnrollments.map((e) => [e.courseId.toString(), true])
    );

    const completedCourses: ILearningPathCompletedCourse[] = [];
    const unlockedCourses: Types.ObjectId[] = [];
    let maxUnlockedOrder = 1;

    // Always unlock first course
    const firstCourseId = sortedItems[0].courseId;
    unlockedCourses.push(firstCourseId);

    let shouldBreak = false;
    for (const item of sortedItems) {
      const courseIdStr = item.courseId.toString();

      if (completedMap.has(courseIdStr)) {
        completedCourses.push({
          courseId: item.courseId,
          isCompleted: true,
          completedAt: new Date(),
        });

        if (!unlockedCourses.some((id) => id.toString() === courseIdStr)) {
          unlockedCourses.push(item.courseId);
        }

        // Unlock next course if available and not already unlocked
        const nextOrder = item.order + 1;
        const nextItem = sortedItems.find((i) => i.order === nextOrder);
        if (nextItem && maxUnlockedOrder < nextOrder) {
          maxUnlockedOrder = nextOrder;
          if (!unlockedCourses.some((id) => id.toString() === nextItem.courseId.toString())) {
            unlockedCourses.push(nextItem.courseId);
          }
        }
      } else {
        // If one course in the sequence is not completed and order > 1, stop unlocking further
        if (item.order > 1) shouldBreak = true;
      }

      if (shouldBreak) break;
    }

    // Update current document fields
    this.completedCourses = completedCourses;
    this.unlockedCourses = unlockedCourses;
    this.unlockedOrder = maxUnlockedOrder;

    // Update completion status
    const total = sortedItems.length;
    const done = completedCourses.length;
    this.completionStatus = done === total ? "COMPLETED" : done > 0 ? "IN_PROGRESS" : "NOT_STARTED";

    next();
  } catch (err) {
    next(err as Error);
  }
});

export const LearningPathEnrollmentModel = model<ILearningPathEnrollment>(
  "LearningPathEnrollment",
  learningPathEnrollmentSchema
);