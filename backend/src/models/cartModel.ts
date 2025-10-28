import { Schema, model, Document, Types } from "mongoose";
export interface PopulatedCartCourse {
  _id: Types.ObjectId;
  courseName: string;
  thumbnailUrl?: string;
}

export interface PopulatedLearningPath {
  _id: Types.ObjectId;
  title: string;
  thumbnailUrl?: string;
}
export interface ICart extends Document {
  userId: Types.ObjectId;
  courses: Types.ObjectId[] | PopulatedCartCourse[];
  learningPaths: Types.ObjectId[] | PopulatedLearningPath[];
  createdAt?: Date;
  updatedAt?: Date;
}

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
    ],
    learningPaths: [
      {
        type: Schema.Types.ObjectId,
        ref: "LearningPath",
        required: true,
      },
    ],
  },
  { timestamps: true },
);

export const CartModel = model<ICart>("Cart", cartSchema);
