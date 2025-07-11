import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import SingleQuestionForm from "../../../components/InstructorComponents/QuizForm";
import { type SingleQuestionFormValues } from "../../../types/interfaces/IQuiz";
import {
  getQuizById,
  updateQuestionInQuiz,
} from "../../../api/action/InstructorActionApi";

const EditQuizPage = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const questionId = searchParams.get("questionId");

  const [initialValues, setInitialValues] = useState<SingleQuestionFormValues>({
    questionText: "",
    options: ["", ""],
    correctAnswer: "",
  });

  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!quizId || !questionId) return;

      try {
        const quiz = await getQuizById(quizId);
        const question = quiz?.questions?.find((q: any) => q._id === questionId);

        if (question) {
          setInitialValues({
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
          });
        } else {
          toast.error("Question not found");
        }
      } catch {
        toast.error("Failed to fetch quiz or question");
      }
    };

    fetchQuestionData();
  }, [quizId, questionId]);

const handleSubmit = async (data: SingleQuestionFormValues) => {
  if (!quizId || !questionId) return;

  try {
    await updateQuestionInQuiz(quizId, questionId, data);
    toast.success("Question updated successfully");
    navigate(`/instructor/course/${courseId}/quiz`);
  } catch (err: any) {
    const errorMessage = err?.response?.data?.message ?? "Failed to update question";
    toast.error(errorMessage);
  }
};


  return (
    <div className="p-4">
      <SingleQuestionForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        buttonLabel="Update Question"
        formTitle="✏️ Edit Question"
      />
    </div>
  );
};

export default EditQuizPage;
