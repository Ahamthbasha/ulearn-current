import  { Schema, model, Document, Types } from "mongoose";

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
  courseId: Types.ObjectId; // ✅ Use `Types.ObjectId`
  questions: Types.DocumentArray<IQuestions>;
}

const QuizSchema = new Schema<IQuiz>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

export const QuizModel = model<IQuiz>("Quiz", QuizSchema);
