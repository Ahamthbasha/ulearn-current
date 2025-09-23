import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSpecificCourse,
  submitQuiz,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { type QuizAttempt } from "../interface/studentInterface";
import { ChevronLeft, Loader2 } from "lucide-react";

const QuizAttemptPage = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await getSpecificCourse(courseId!);
        const quizData = res?.enrollment?.courseId?.quizzes?.find(
          (q: QuizAttempt) => q._id === quizId
        );
        if (!quizData) {
          toast.error("Quiz not found");
          navigate(`/user/enrolled`);
        } else {
          setQuiz(quizData);
        }
      } catch (err) {
        toast.error("Failed to load quiz");
        navigate(`/user/enrolled`);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId, quizId, navigate]);

  const handleOptionChange = (qIndex: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // ✅ Validation: Ensure all questions are answered
    const unanswered = quiz.questions
      .map((_, idx) => idx)
      .filter((i) => !answers[i]);

    if (unanswered.length > 0) {
      const missed = unanswered.map((i) => `Q${i + 1}`).join(", ");
      toast.error(`Please answer the following question(s): ${missed}`);
      return;
    }

    const total = quiz.questions.length;
    let correct = 0;

    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        correct += 1;
      }
    });

    const percentage = Math.round((correct / total) * 100);

    try {
      setSubmitting(true);
      await submitQuiz({
        courseId: courseId!,
        quizId: quizId!,
        totalQuestions: total,
        correctAnswers: correct,
        percentage,
      });

      toast.success(`Submitted! You scored ${percentage}%`);
      navigate(`/user/enrolled`);
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading Quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
            {quiz.title}
          </h1>
          <button
            onClick={() => navigate(`/user/enrolled`)}
            className="text-blue-600 hover:underline text-sm sm:text-base flex items-center"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Back to Course
          </button>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {quiz.questions.map((q, index) => (
            <div
              key={index}
              className="p-4 sm:p-6 border rounded-lg shadow-md hover:shadow-lg bg-white transition duration-300"
            >
              <p className="font-semibold text-gray-700 mb-3 text-base sm:text-lg">
                {index + 1}. {q.questionText}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className="flex items-center space-x-3 text-gray-600 text-sm sm:text-base"
                  >
                    <input
                      type="radio"
                      name={`q-${index}`}
                      value={opt}
                      checked={answers[index] === opt}
                      onChange={() => handleOptionChange(index, opt)}
                      className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-purple-600 focus:ring-purple-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-10 text-right">
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-300 shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptPage;