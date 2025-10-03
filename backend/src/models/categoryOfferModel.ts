import { Schema, model, Document, Types } from "mongoose";

export interface ICategoryOffer extends Document {
  categoryId: Types.ObjectId;
  discountPercentage: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  courseOffers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryOfferSchema = new Schema<ICategoryOffer>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
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
        validator: function (this: ICategoryOffer, value: Date) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    courseOffers: [
      {
        type: Schema.Types.ObjectId,
        ref: "CourseOffer",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to calculate discounted price for courses (if needed)
CategoryOfferSchema.virtual("discountedPrice").get(function (this: ICategoryOffer) {
  return this.populated("courseOffers")
    ? (this.courseOffers as any).map((offer: any) =>
        offer.populated("courseId")
          ? offer.courseId.price * (1 - this.discountPercentage / 100)
          : null
      )
    : null;
});

export const CategoryOfferModel = model<ICategoryOffer>("CategoryOffer", CategoryOfferSchema);