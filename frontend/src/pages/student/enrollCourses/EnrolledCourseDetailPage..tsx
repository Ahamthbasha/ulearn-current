import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSpecificCourse,
  markChapterAsCompleted,
  checkChapterCompletedOrNot,
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
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = (user?.name || "Guest").toUpperCase();

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await getSpecificCourse(courseId!);
        setEnrollment(response.enrollment);
        setCompletedChapterIds(
          response.enrollment.completedChapters.map(
            (c: { chapterId: string }) => c.chapterId
          )
        );
      } catch (err) {
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [courseId]);

  const handleMarkCompleted = async (chapterId: string) => {
    try {
      await markChapterAsCompleted(courseId!, chapterId);
      setCompletedChapterIds((prev) => [...prev, chapterId]);
      toast.success("Chapter marked as completed!");
    } catch (err) {
      toast.error("Failed to mark chapter as completed");
    }
  };

  const calculateProgress = () => {
    if (!enrollment) return 0;
    return Math.round(
      (completedChapterIds.length / enrollment.courseId.chapters.length) * 100
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">No course found.</p>
          <button
            onClick={() => navigate("/user/enrolled")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-300"
          >
            <ChevronLeft className="inline mr-2 h-5 w-5" /> Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const course = enrollment.courseId;
  const currentChapter = course.chapters[currentChapterIndex];
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navbar */}
      <nav className="bg-white shadow-md px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <span className="font-bold text-xl sm:text-2xl text-gray-800">
                Ulearn
              </span>
            </div>
            <div className="h-5 w-px bg-gray-300"></div>
            <button
              onClick={() => navigate("/user/enrolled")}
              className="text-gray-600 hover:text-blue-600 text-sm sm:text-base flex items-center"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Back to
              Courses
            </button>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right">
              <p className="text-sm sm:text-base font-medium text-gray-700">
                {username}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Student</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-gray-200">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs sm:text-sm">
                    👤
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarCollapsed ? "w-16" : "w-80 md:w-64 sm:w-60"
          } bg-white shadow-lg flex flex-col transition-all duration-300 ease-in-out`}
        >
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2
                className={`font-bold text-gray-800 ${
                  sidebarCollapsed ? "hidden" : "text-lg sm:text-xl"
                }`}
              >
                {course.courseName}
              </h2>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 transform transition-transform ${
                    sidebarCollapsed ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>

            {!sidebarCollapsed && (
              <>
                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {progress}%
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">
                  {completedChapterIds.length} of {course.chapters.length}{" "}
                  chapters completed
                </p>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-4">
              {!sidebarCollapsed && (
                <h3 className="text-xs sm:text-sm text-gray-400 uppercase mb-2 sm:mb-3 tracking-widest font-semibold">
                  Chapters
                </h3>
              )}
              <div className="space-y-1 sm:space-y-2">
                {course.chapters.map((chapter, index) => {
                  const isCompleted = completedChapterIds.includes(chapter._id);
                  const isCurrent = index === currentChapterIndex;

                  return (
                    <div
                      key={chapter._id}
                      onClick={() => setCurrentChapterIndex(index)}
                      className={`group cursor-pointer rounded-lg transition-all duration-200 ${
                        isCurrent
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="p-2 sm:p-3 flex items-center space-x-2">
                        <div
                          className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                            isCurrent
                              ? "bg-white text-blue-600"
                              : isCompleted
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium truncate ${
                                isCurrent ? "text-white" : "text-gray-800"
                              }`}
                            >
                              {chapter.chapterTitle}
                            </p>
                            <p
                              className={`text-xs ${
                                isCurrent ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
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
                  <div className="mt-4 sm:mt-6">
                    <button
                      onClick={async () => {
                        try {
                          const res = await checkChapterCompletedOrNot(
                            course._id
                          );
                          if (res?.allCompleted) {
                            navigate(
                              `/quiz/${course._id}/${course.quizzes[0]._id}`
                            );
                          } else {
                            toast.warning(
                              "Please complete all chapters before attempting the quiz."
                            );
                          }
                        } catch {
                          toast.error(
                            "Unable to check chapter completion status."
                          );
                        }
                      }}
                      className={`w-full flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 ${
                        sidebarCollapsed
                          ? "justify-center text-[0px] p-2"
                          : "text-sm sm:text-base font-medium"
                      } text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition duration-300`}
                      title="Start Quiz"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      {!sidebarCollapsed && <span className="ml-2">Start Quiz</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {currentChapter.chapterTitle}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Chapter {currentChapterIndex + 1} of {course.chapters.length}
            </p>
          </div>

          <div className="flex-1 p-4 sm:p-6 bg-gray-50">
            <div className="bg-black rounded-xl overflow-hidden h-full max-h-[60vh] sm:max-h-[70vh] shadow-lg">
              <video
                controls
                key={currentChapter._id}
                className="w-full h-full object-contain"
                onEnded={() => {
                  if (!completedChapterIds.includes(currentChapter._id)) {
                    handleMarkCompleted(currentChapter._id);
                  }
                }}
              >
                <source src={currentChapter.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <button
              disabled={currentChapterIndex === 0}
              onClick={() => setCurrentChapterIndex((prev) => prev - 1)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition duration-300 flex items-center justify-center"
            >
              <ChevronLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Previous
              Chapter
            </button>

            <div className="text-sm sm:text-base text-gray-600 text-center">
              Chapter {currentChapterIndex + 1} of {course.chapters.length} —{" "}
              {progress}% Complete
            </div>

            <button
              disabled={currentChapterIndex === course.chapters.length - 1}
              onClick={() => setCurrentChapterIndex((prev) => prev + 1)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-300 flex items-center justify-center"
            >
              Next Chapter <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnrolledCourseDetailPage;