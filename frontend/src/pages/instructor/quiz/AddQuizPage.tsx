import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import SingleQuestionForm from "../../../components/InstructorComponents/QuizForm";
import { type SingleQuestionFormValues } from "../../../types/interfaces/IQuiz";
import {
  createQuiz,
  addQuestionToQuiz,
  getQuizByCourseId,
} from "../../../api/action/InstructorActionApi";

const AddQuizPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const initialValues: SingleQuestionFormValues = {
    questionText: "",
    options: ["", ""],
    correctAnswer: "",
  };

const handleSubmit = async (data: SingleQuestionFormValues) => {
  if (!courseId) {
    toast.error("Course ID not found");
    return;
  }

  try {
    let existingQuiz: any = null;

    try {
      existingQuiz = await getQuizByCourseId(courseId);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        throw err; // Only rethrow if it's not 404
      }
    }

    if (existingQuiz?.questions?.length > 0) {
      // ✅ Quiz exists → add question
      const res = await addQuestionToQuiz(courseId, data);
      toast.success(res.message ?? "Question added to existing quiz");
    } else {
      // ❌ Quiz doesn't exist → create quiz
      const payload = {
        courseId,
        questions: [data],
      };
      const res = await createQuiz(payload);
      toast.success(res.message ?? "Quiz created successfully");
    }

    navigate(`/instructor/course/${courseId}/quiz`);
  } catch (err: any) {
    const errorMessage =
      err?.response?.data?.message ?? "Failed to create or add question";
    toast.error(errorMessage);
  }
};


  return (
    <div className="p-4">
      <SingleQuestionForm
        onSubmit={handleSubmit}
        initialValues={initialValues}
        buttonLabel="Add Question"
        formTitle="📝 Add a New Question"
      />
    </div>
  );
};

export default AddQuizPage;
