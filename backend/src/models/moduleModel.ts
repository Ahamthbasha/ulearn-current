import { Schema, Types, model, Document } from "mongoose";

export interface IModule extends Document {
  _id: Types.ObjectId;
  moduleTitle: string;
  courseId: Types.ObjectId;
  position:number;
  moduleNumber?: number;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateModuleDTO {
  moduleTitle: string;
  courseId: Types.ObjectId;
  description: string;
  moduleNumber?: number;
}

const ModuleSchema = new Schema<IModule>(
  {
    moduleTitle: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    position: { type: Number, required: true },
    moduleNumber: { type: Number },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// Virtual to populate chapters
ModuleSchema.virtual("chapters", {
  ref: "Chapter",
  localField: "_id",
  foreignField: "moduleId",
  justOne: false,
});

// Ensure virtuals are included in JSON
ModuleSchema.set("toJSON", { virtuals: true });
ModuleSchema.set("toObject", { virtuals: true });

export const ModuleModel = model<IModule>("Module", ModuleSchema);