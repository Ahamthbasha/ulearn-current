import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSpecificCourse,
  markChapterAsCompleted,
  checkChapterCompletedOrNot,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";

interface Chapter {
  _id: string;
  chapterTitle: string;
  videoUrl: string;
}

interface Quiz {
  _id: string;
  title: string;
  totalQuestions: number;
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: string;
  }[];
}

interface Course {
  _id: string;
  courseName: string;
  description: string;
  thumbnailUrl: string;
  demoVideo?: {
    type: string;
    url: string;
  };
  chapters: Chapter[];
  quizzes: Quiz[];
}

interface Enrollment {
  _id: string;
  courseId: Course;
  completedChapters: { chapterId: string }[];
}

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading course details...</p>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No course found.</p>
          <button
            onClick={() => navigate("/user/enrolled")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courses
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
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <span className="font-bold text-xl">Ulearn</span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <button
              onClick={() => navigate("/user/enrolled")}
              className="text-gray-600 hover:text-blue-600 text-sm flex items-center"
            >
              ← Back to Courses
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{username}</p>
              <p className="text-xs text-gray-500">Student</p>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border bg-white">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">👤</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarCollapsed ? "w-16" : "w-80"
          } bg-white shadow-lg flex flex-col transition-all duration-300 ease-in-out`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`font-bold text-gray-800 ${
                  sidebarCollapsed ? "hidden" : "text-lg"
                }`}
              >
                {course.courseName}
              </h2>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg
                  className={`w-5 h-5 transform transition-transform ${
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
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {progress}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {completedChapterIds.length} of {course.chapters.length}{" "}
                  chapters completed
                </p>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {!sidebarCollapsed && (
                <h3 className="text-xs text-gray-400 uppercase mb-4 tracking-widest font-semibold">
                  Chapters
                </h3>
              )}
              <div className="space-y-2">
                {course.chapters.map((chapter, index) => {
                  const isCompleted = completedChapterIds.includes(chapter._id);
                  const isCurrent = index === currentChapterIndex;

                  return (
                    <div
                      key={chapter._id}
                      onClick={() => setCurrentChapterIndex(index)}
                      className={`group cursor-pointer rounded-xl transition-all duration-200 ${
                        isCurrent
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="p-3 flex items-center space-x-3">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCurrent
                              ? "bg-white text-blue-600"
                              : isCompleted
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isCompleted ? (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
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
                  <div className="mt-6">
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
                      className={`w-full flex items-center justify-center px-4 py-2 ${
                        sidebarCollapsed
                          ? "justify-center text-[0px] p-2"
                          : "text-sm font-medium"
                      } text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition`}
                      title="Start Quiz"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.752 11.168l-5.197-3.03A1 1 0 008 9.03v5.939a1 1 0 001.555.832l5.197-3.03a1 1 0 000-1.732z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {!sidebarCollapsed && (
                        <span className="ml-2">Start Quiz</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="p-6 border-b border-gray-200 bg-white">
            <h1 className="text-2xl font-bold text-gray-800">
              {currentChapter.chapterTitle}
            </h1>
            <p className="text-gray-600 mt-1">
              Chapter {currentChapterIndex + 1} of {course.chapters.length}
            </p>
          </div>

          <div className="flex-1 p-6 bg-gray-50">
            <div className="bg-black rounded-lg overflow-hidden h-full max-h-[60vh] shadow-lg">
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

          <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center">
            <button
              disabled={currentChapterIndex === 0}
              onClick={() => setCurrentChapterIndex((prev) => prev - 1)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              ← Previous Chapter
            </button>

            <div className="text-sm text-gray-600">
              Chapter {currentChapterIndex + 1} of {course.chapters.length} —{" "}
              {progress}% Complete
            </div>

            <button
              disabled={currentChapterIndex === course.chapters.length - 1}
              onClick={() => setCurrentChapterIndex((prev) => prev + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next Chapter →
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnrolledCourseDetailPage;
