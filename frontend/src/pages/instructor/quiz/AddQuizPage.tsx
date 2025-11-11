import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import SingleQuestionForm from "../../../components/InstructorComponents/QuizForm";
import { type SingleQuestionFormValues } from "../../../types/interfaces/IQuiz";
import {
  createQuiz,
  addQuestionToQuiz,
  getQuizByModuleId,
} from "../../../api/action/InstructorActionApi";

const AddQuizPage = () => {
  const { courseId, moduleId } = useParams<{
    courseId: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();

  const initialValues: SingleQuestionFormValues = {
    questionText: "",
    options: ["", ""],
    correctAnswer: "",
  };

  const handleSubmit = async (data: SingleQuestionFormValues) => {
    if (!courseId || !moduleId) {
      toast.error("Course or Module ID is missing");
      return;
    }

    try {
      let quizExists = true;

      try {
        await getQuizByModuleId(moduleId);
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) {
          quizExists = false;
        } else {
          throw error;
        }
      }
      if (!quizExists) {
        try {
          await createQuiz(moduleId);
          toast.success("Quiz created for this module");
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          const message = err.response?.data?.message || "";
          if (message.includes("already created")) {
            toast.info("Quiz already exists");
          } else {
            throw error;
          }
        }
      }

      try {
        await addQuestionToQuiz(moduleId, data);
        toast.success("Question added successfully");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        const message = err.response?.data?.message || "";
        if (message.includes("already exists")) {
          toast.error("This question already exists in the quiz");
          return;
        }
        throw error;
      }

      navigate(`/instructor/course/${courseId}/modules/${moduleId}/quiz`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Failed to complete operation";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Add Quiz Question</h1>
        <p className="text-sm text-gray-600 mt-1">
          Module ID: {moduleId || "Loading..."}
        </p>
      </div>

      <SingleQuestionForm
        onSubmit={handleSubmit}
        initialValues={initialValues}
        buttonLabel="Add Question"
        formTitle="Add a New Question"
      />
    </div>
  );
};

export default AddQuizPage;