import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getSpecificCourse,
  markChapterAsCompleted,
  checkChapterCompletedOrNot,
  submitQuiz,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { type Enrollment } from "../interface/studentInterface";
import {
  Play,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

const EnrolledCourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = (user?.name || "Guest").toUpperCase();
  const learningPathId = location.state?.learningPathId;

  const fetchEnrollment = useCallback(async () => {
    try {
      const response = await getSpecificCourse(courseId!);
      setEnrollment(response.enrollment);
      setCompletedChapterIds(
        response.enrollment.completedChapters.map(
          (c: { chapterId: string }) => c.chapterId
        )
      );
      return response.enrollment;
    } catch (err) {
      toast.error("Failed to load course details");
      throw err;
    }
  }, [courseId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchEnrollment();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchEnrollment]);

  const handleMarkCompleted = async (chapterId: string) => {
    try {
      await markChapterAsCompleted(courseId!, chapterId);
      await fetchEnrollment(); // Refetch to update both completed chapters and completionPercentage from backend
      toast.success("Chapter marked as completed!");
    } catch (err) {
      toast.error("Failed to mark chapter as completed");
    }
  };

  // Auto-mark completion based on video progress (90% threshold)
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (
      video &&
      video.duration &&
      !isNaN(video.duration) &&
      video.readyState > 0 &&
      !completedChapterIds.includes(currentChapter._id)
    ) {
      const progress = (video.currentTime / video.duration) * 100;
      if (progress >= 90) { // Adjust threshold as needed (e.g., 80% or 100%)
        handleMarkCompleted(currentChapter._id);
      }
    }
  }, [completedChapterIds, currentChapterIndex, handleMarkCompleted]); // Note: completedChapterIds is array; effect will re-run on changes

  useEffect(() => {
    const video = videoRef.current;
    if (!video || showQuiz) return;

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", () => {
      // Ensure completion if video fully watched
      if (!completedChapterIds.includes(currentChapter._id)) {
        handleMarkCompleted(currentChapter._id);
      }
    });

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", () => {});
    };
  }, [handleTimeUpdate, showQuiz, completedChapterIds, currentChapterIndex]);

  const handleStartQuiz = async () => {
    try {
      const res = await checkChapterCompletedOrNot(courseId!);
      if (res?.allCompleted) {
        setShowQuiz(true);
      } else {
        toast.warning("Please complete all chapters before attempting the quiz.");
      }
    } catch {
      toast.error("Unable to check chapter completion status.");
    }
  };

  const handleOptionChange = (qIndex: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const handleQuizSubmit = async () => {
    if (!enrollment || !enrollment.courseId.quizzes[0]) return;

    const quiz = enrollment.courseId.quizzes[0];
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
        quizId: quiz._id,
        totalQuestions: total,
        correctAnswers: correct,
        percentage,
      });

      toast.success(`Submitted! You scored ${percentage}%`);
      navigate(learningPathId ? `/user/enrolledLms/${learningPathId}` : `/user/enrolled`);
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackNavigation = () => {
    if (learningPathId) {
      navigate(`/user/enrolledLms/${learningPathId}`);
    } else {
      navigate("/user/enrolled");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" /> Loading course details...
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>No course found.</p>
        <button
          onClick={handleBackNavigation}
          className="text-blue-600 hover:underline"
        >
          {learningPathId ? "Back to Learning Path" : "Back to Courses"}
        </button>
      </div>
    );
  }

  const course = enrollment.courseId;
  const currentChapter = course.chapters[currentChapterIndex];
  const quiz = course.quizzes[0];
  const isChapterCompleted = completedChapterIds.includes(currentChapter._id);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Navbar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <button onClick={() => navigate("/")} className="text-2xl font-bold">
          Ulearn
        </button>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackNavigation}
            className="text-blue-600 hover:underline"
          >
            {learningPathId ? "Back to Learning Path" : "Back to Courses"}
          </button>
          <span>{username}</span>
          <span className="text-gray-500">Student</span>
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <span className="text-2xl">👤</span>
          )}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`bg-white shadow-md p-4 transition-all duration-300 ${
            sidebarCollapsed ? "w-16" : "w-64"
          } overflow-y-auto`}
        >
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && <h2 className="text-lg font-semibold">{course.courseName}</h2>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${enrollment.completionPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-1">
                  {enrollment.completionPercentage}% Complete
                </p>
                <p className="text-xs text-gray-500">
                  {completedChapterIds.length} of {course.chapters.length} chapters
                  completed
                </p>
              </div>
            </>
          )}

          {!sidebarCollapsed && <h3 className="text-sm font-medium mb-2">Chapters</h3>}
          {course.chapters.map((chapter, index) => {
            const isCompleted = completedChapterIds.includes(chapter._id);
            const isCurrent = index === currentChapterIndex;

            return (
              <div
                key={chapter._id}
                onClick={() => {
                  setCurrentChapterIndex(index);
                  setShowQuiz(false); // Reset to chapter view when clicking a chapter
                }}
                className={`group cursor-pointer rounded-lg p-2 transition-all duration-200 ${
                  isCurrent && !showQuiz
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  {!sidebarCollapsed && (
                    <div>
                      <p className="text-sm font-medium">{chapter.chapterTitle}</p>
                      <p className="text-xs">
                        {isCompleted ? "Completed" : "Not completed"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Start Quiz Button at Bottom */}
          {course.quizzes.length > 0 && (
            <button
              onClick={handleStartQuiz}
              className={`w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 ${
                sidebarCollapsed
                  ? "justify-center text-[0px] p-2"
                  : "text-sm sm:text-base font-medium"
              } text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition duration-300`}
              title="Start Quiz"
            >
              {!sidebarCollapsed && "Start Quiz"}
              {sidebarCollapsed && <Play />}
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {showQuiz && quiz ? (
            <>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Quiz</h2>
              <p className="text-sm text-gray-500 mb-4">
                {quiz.questions.length} Question{quiz.questions.length > 1 ? "s" : ""}
              </p>
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
                  onClick={handleQuizSubmit}
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-300 shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                {currentChapter.chapterTitle}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Chapter {currentChapterIndex + 1} of {course.chapters.length}
              </p>
              <div className="mb-6">
                <video
                  ref={videoRef}
                  controls
                  className="w-full rounded-lg shadow-lg"
                  src={currentChapter.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
                {isChapterCompleted ? (
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> Chapter completed!
                  </p>
                ) : (
                  <p className="text-sm text-blue-600 mt-2 flex items-center">
                    <Play className="w-4 h-4 mr-1" /> Watch the video to automatically complete this chapter (90% progress required).
                  </p>
                )}
                {/* Manual button removed to avoid manual marking; auto-detection handles it */}
              </div>
              <div className="flex justify-between items-center">
                <button
                  disabled={currentChapterIndex === 0}
                  onClick={() => setCurrentChapterIndex((prev) => prev - 1)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition duration-300 flex items-center justify-center"
                >
                  <ChevronLeft className="mr-2" /> Previous Chapter
                </button>
                <p className="text-sm text-gray-500">
                  Chapter {currentChapterIndex + 1} of {course.chapters.length} —{" "}
                  {enrollment.completionPercentage}% Complete
                </p>
                <button
                  disabled={currentChapterIndex === course.chapters.length - 1}
                  onClick={() => setCurrentChapterIndex((prev) => prev + 1)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-300 flex items-center justify-center"
                >
                  Next Chapter <ChevronRight className="ml-2" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrolledCourseDetailPage;