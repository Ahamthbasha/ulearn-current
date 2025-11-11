import { Schema, model, Document, Types } from "mongoose";

export interface IQuestions extends Document {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

const QuestionSchema = new Schema<IQuestions>({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  moduleId: Types.ObjectId;
  questions: Types.DocumentArray<IQuestions>;
  createdAt?: Date;
  updatedAt?: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true,
    },
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

export const QuizModel = model<IQuiz>("Quiz", QuizSchema);