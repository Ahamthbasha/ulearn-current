import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Card from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import EntityTable from "../../../components/common/EntityTable";
import { useDebounce } from "../../../hooks/UseDebounce";
import {
  getPaginatedQuestionsByModuleId,
  deleteQuiz,
  deleteQuestionFromQuiz,
} from "../../../api/action/InstructorActionApi";
import { type IQuestion } from "../../../types/interfaces/IQuiz";
import type { ApiError } from "../../../types/interfaces/ICommon";

interface QuestionWithQuizId extends IQuestion {
  [key: string]: unknown;
  quizId?: string;
}

const QuizManagementPage = () => {
  const { courseId, moduleId } = useParams<{
    courseId: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionWithQuizId[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  const fetchQuestions = async () => {
    if (!moduleId) {
      toast.error("Module ID not found");
      return;
    }

    try {
      setLoading(true);
      const response = await getPaginatedQuestionsByModuleId(
        moduleId,
        page,
        limit,
        debouncedSearch
      );

      const questionsWithQuizId: QuestionWithQuizId[] = response.questions.map(
        (q: IQuestion) => ({
          ...q,
          quizId: response.quizId,
        })
      );

      setQuestions(questionsWithQuizId);
      setQuizId(response.quizId);
      setTotal(response.total || 0);
    } catch (error) {
      const apiError = error as ApiError;
      setQuestions([]);
      setQuizId(null);
      setTotal(0);
      toast.error(apiError?.response?.data?.message || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string, quizId: string) => {
    try {
      await deleteQuestionFromQuiz(quizId, questionId);
      toast.success("Question deleted");
      fetchQuestions();
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(
        apiError?.response?.data?.message || "Failed to delete question"
      );
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizId) return;
    try {
      await deleteQuiz(quizId);
      toast.success("Quiz deleted");
      fetchQuestions();
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError?.response?.data?.message || "Failed to delete quiz");
    }
  };

  // New: Back to Module
  const handleBackToModule = () => {
    navigate(`/instructor/course/${courseId}/modules`);
  };

  useEffect(() => {
    fetchQuestions();
  }, [moduleId, page, debouncedSearch]);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <Card
        padded
        className="bg-white shadow-sm rounded-lg"
        header={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Back Button + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToModule}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Module"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold">Quiz Management</h2>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {quizId ? (
                <>
                  <Button
                    onClick={() =>
                      navigate(
                        `/instructor/course/${courseId}/modules/${moduleId}/quiz/add`
                      )
                    }
                    className="w-full sm:w-auto flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeleteQuiz}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Quiz
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() =>
                    navigate(
                      `/instructor/course/${courseId}/modules/${moduleId}/quiz/add`
                    )
                  }
                  className="w-full sm:w-auto flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Quiz
                </Button>
              )}
            </div>
          </div>
        }
      >
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search questions..."
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded mb-4"
        />

        {loading ? (
          <p className="text-sm text-gray-600">Loading questions...</p>
        ) : questions.length > 0 ? (
          <EntityTable<QuestionWithQuizId>
            title="All Quiz Questions"
            data={questions}
            columns={[
              { key: "questionText", label: "Question" },
              { key: "correctAnswer", label: "Correct Answer" },
            ]}
            onEdit={(q) =>
              navigate(
                `/instructor/course/${courseId}/modules/${moduleId}/quiz/edit/${q.quizId ?? ''}?questionId=${q._id ?? ''}`
              )
            }
            onDelete={(q) => {
              if (q._id && q.quizId) handleDeleteQuestion(q._id, q.quizId);
            }}
            emptyText="No questions found"
            pagination={{
              currentPage: page,
              totalItems: total,
              pageSize: limit,
              onPageChange: (p) => setPage(p),
            }}
          />
        ) : (
          <p className="text-sm text-gray-600">
            No quiz or questions found for this module.
          </p>
        )}
      </Card>
    </div>
  );
};

export default QuizManagementPage;