import { Schema, Types, model, Document } from "mongoose";

export interface IChapter extends Document {
  _id: Types.ObjectId;
  chapterTitle: string;
  courseId: Types.ObjectId;
  chapterNumber?: number;
  description: string;
  videoUrl: string;
  createdAt?: Date;
}
export interface CreateChapterDTO {
  chapterTitle: string;
  courseId: Types.ObjectId;
  description: string;
  videoUrl: string;
  chapterNumber?: number;
}

const ChapterSchema = new Schema<IChapter>(
  {
    chapterTitle: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true }, // Corrected to ObjectId
    chapterNumber: { type: Number },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
  },
  { timestamps: true },
);

export const ChapterModel = model<IChapter>("Chapter", ChapterSchema);
