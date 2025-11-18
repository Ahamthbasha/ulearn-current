import { Schema, Types, model, Document } from "mongoose";
import { IChapter } from "./chapterModel";
import { IQuiz } from "./quizModel";

export interface CreateModuleDTO {
  moduleTitle: string;
  courseId: Types.ObjectId;
  description: string;
}

export interface IModule extends Document {
  _id: Types.ObjectId;
  moduleTitle: string;
  courseId: Types.ObjectId;
  position: number;
  moduleNumber?: number;
  description: string;
  duration?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IModulePopulated extends IModule {
  chapters: IChapter[];
  quiz?: IQuiz | null;
}

const ModuleSchema = new Schema<IModule>(
  {
    moduleTitle: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    position: { type: Number, required: true },
    moduleNumber: { type: Number },
    description: { type: String, required: true },
    duration: { type: String, default: "0" },
  },
  { timestamps: true }
);

ModuleSchema.virtual("chapters", {
  ref: "Chapter",
  localField: "_id",
  foreignField: "moduleId",
  justOne: false,
});

ModuleSchema.virtual("quiz", {
  ref: "Quiz",
  localField: "_id",
  foreignField: "moduleId",
  justOne: true,
});

ModuleSchema.set("toJSON", { virtuals: true });
ModuleSchema.set("toObject", { virtuals: true });

export const ModuleModel = model<IModule>("Module", ModuleSchema);