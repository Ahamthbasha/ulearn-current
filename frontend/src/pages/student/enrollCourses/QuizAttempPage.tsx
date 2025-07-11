import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSpecificCourse, submitQuiz } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";

interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  _id: string;
  title: string;
  totalQuestions: number;
  questions: QuizQuestion[];
}

const QuizAttemptPage = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await getSpecificCourse(courseId!);
        const quizData = res?.enrollment?.courseId?.quizzes?.find((q: Quiz) => q._id === quizId);
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
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

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
  percentage
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading Quiz...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
          <button
            onClick={() => navigate(`/user/enrolled`)}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Course
          </button>
        </div>

        <div className="space-y-8">
          {quiz.questions.map((q, index) => (
            <div key={index} className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <p className="font-semibold text-gray-700 mb-3">
                {index + 1}. {q.questionText}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className="flex items-center space-x-3 text-gray-600"
                  >
                    <input
                      type="radio"
                      name={`q-${index}`}
                      value={opt}
                      checked={answers[index] === opt}
                      onChange={() => handleOptionChange(index, opt)}
                      className="form-radio text-blue-600"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-right">
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptPage;
