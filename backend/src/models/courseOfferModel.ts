import { Schema, model, Document, Types } from "mongoose";

export interface ICourseOffer extends Document {
  courseId: Types.ObjectId;
  discountPercentage: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseOfferSchema = new Schema<ICourseOffer>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100, 
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: ICourseOffer, value: Date) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to calculate discounted price
CourseOfferSchema.virtual("discountedPrice").get(function (this: ICourseOffer) {
  return this.populated("courseId")
    ? (this.courseId as any).price * (1 - this.discountPercentage / 100)
    : null;
});

export const CourseOfferModel = model<ICourseOffer>("CourseOffer", CourseOfferSchema);