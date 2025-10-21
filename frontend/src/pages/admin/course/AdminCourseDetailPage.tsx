import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCourseDetails,
  verifyCourse,
} from "../../../api/action/AdminActionApi";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Eye,
  Globe,
  Shield,
  PlayCircle,
  Check,
  X,
} from "lucide-react";
import type { CourseDetailsResponse } from "../interface/adminInterface";

const AdminCourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState<CourseDetailsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectReason, setShowRejectReason] = useState<boolean>(false);

  const fetchCourseDetails = async () => {
    if (!courseId) {
      setError("Course ID is missing");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await getCourseDetails(courseId);
      if (response?.data) {
        setCourseData(response.data);
      } else {
        setError("Course not found.");
      }
    } catch (err) {
      console.error("Error fetching course details:", err);
      setError("Failed to load course details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const handleVerify = async (action: "approve" | "reject") => {
    if (!courseId) return;

    if (action === "reject" && !rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setVerifying(true);
    try {
      await verifyCourse({
        courseId,
        status: action === "approve" ? "approved" : "rejected",
        review: action === "reject" ? rejectReason : undefined,
      });
      toast.success(`Course ${action === "approve" ? "approved" : "rejected"} successfully`);
      await fetchCourseDetails(); // Refresh to reflect updated status
      setRejectReason("");
      setShowRejectReason(false);
    } catch (err: any) {
      console.error("Failed to verify course", err);
      toast.error(err?.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base font-medium">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="min-h-[50vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm border border-red-200 rounded-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full text-center shadow-xl animate-fade-in">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl sm:text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Error Loading Course</h3>
          <p className="text-gray-600 text-sm sm:text-base mb-6">{error || "Course not found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-4 py-2 sm:px-5 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 text-sm sm:text-base font-medium shadow-sm hover:shadow-md focus:ring-2 focus:ring-red-500"
            aria-label="Go Back"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { course, chapters, quiz } = courseData;

  return (
    <div className="min-h-[50vh] bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 text-sm sm:text-base font-medium focus:ring-2 focus:ring-blue-500"
                aria-label="Back to Courses"
              >
                <ArrowLeft size={16} className="sm:size-18" />
                <span className="hidden sm:inline">Back to Courses</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs lg:max-w-md capitalize">
                {course.courseName}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6 sm:mb-8 animate-fade-in">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {/* Course Info */}
              <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight capitalize">
                    {course.courseName}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <span
                    className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-sm hover:scale-105 transition-transform duration-200 ${
                      course.isListed
                        ? "bg-green-200 text-green-800 border border-green-300"
                        : "bg-yellow-200 text-yellow-800 border border-yellow-300"
                    }`}
                  >
                    <Eye size={12} className="mr-1 sm:mr-2 sm:size-14" />
                    {course.isListed ? "Listed" : "Not Listed"}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-sm hover:scale-105 transition-transform duration-200 ${
                      course.isPublished
                        ? "bg-blue-200 text-blue-800 border border-blue-300"
                        : "bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <Globe size={12} className="mr-1 sm:mr-2 sm:size-14" />
                    {course.isPublished ? "Published" : "Not Published"}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-sm hover:scale-105 transition-transform duration-200 ${
                      course.isVerified
                        ? "bg-purple-200 text-purple-800 border border-purple-300"
                        : "bg-red-200 text-red-800 border border-red-300"
                    }`}
                  >
                    <Shield size={12} className="mr-1 sm:mr-2 sm:size-14" />
                    {course.isVerified ? "Verified" : "Not Verified"}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-sm hover:scale-105 transition-transform duration-200 ${
                      course.isSubmitted
                        ? "bg-blue-200 text-blue-800 border border-blue-300"
                        : "bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <CheckCircle size={12} className="mr-1 sm:mr-2 sm:size-14" />
                    {course.isSubmitted ? "Submitted" : "Not Submitted"}
                  </span>
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white/90 backdrop-blur-sm border border-green-200 rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <DollarSign size={16} className="text-white sm:size-20" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-green-700">Price</p>
                        <p className="text-lg sm:text-xl font-bold text-green-900">₹{course.price}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <BarChart3 size={16} className="text-white sm:size-20" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-blue-700">Level</p>
                        <p className="text-lg sm:text-xl font-bold text-blue-900 capitalize">{course.level}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-sm border border-orange-200 rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                        <Clock size={16} className="text-white sm:size-20" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-orange-700">Duration</p>
                        <p className="text-lg sm:text-xl font-bold text-orange-900">{course.duration}h</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Section */}
                {course.review && !course.isVerified && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6 shadow-md">
                    <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2">Rejection Reason</h3>
                    <p className="text-sm sm:text-base text-red-700">{course.review}</p>
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div className="lg:col-span-2">
                {course.thumbnailUrl ? (
                  <div className="relative group">
                    <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                      <img
                        src={course.thumbnailUrl}
                        alt="Course Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
                          <p className="text-white text-sm sm:text-base font-semibold">Course Preview</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-xl">
                    <div className="text-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <PlayCircle className="text-blue-600 sm:size-28" />
                      </div>
                      <p className="text-blue-700 text-sm sm:text-base font-medium">No Thumbnail</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Video Section */}
        {course.demoVideo && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                <PlayCircle size={20} className="text-white sm:size-24" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Demo Video</h3>
            </div>
            <div className="aspect-[16/9] bg-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
              <video
                controls
                className="w-full h-full object-cover"
                poster={course.thumbnailUrl}
              >
                <source src={course.demoVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Chapters Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg sm:text-xl">📚</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Course Chapters</h3>
            </div>
            <span className="inline-flex items-center px-2 sm:px-3 py-1 bg-blue-200 text-blue-800 text-xs sm:text-sm font-semibold rounded-full shadow-sm">
              {chapters.length} {chapters.length === 1 ? "Chapter" : "Chapters"}
            </span>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-10 sm:py-12">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">📝</span>
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Chapters Yet</h4>
              <p className="text-sm sm:text-base text-gray-500">
                Chapters will appear here once they are added to the course.
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {chapters.map((chapter) => (
                <div
                  key={chapter.chapterId}
                  className="bg-gradient-to-r from-gray-50 to-blue-50/20 border border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm sm:text-lg shadow-md">
                        {chapter.chapterNumber || 1}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 sm:space-y-4">
                      <div>
                        <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 capitalize">
                          {chapter.chapterTitle}
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {chapter.chapterDescription}
                        </p>
                      </div>

                      {chapter.videoUrl && (
                        <div className="aspect-[16/9] bg-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                          <video
                            controls
                            className="w-full h-full object-cover"
                          >
                            <source src={chapter.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg sm:text-xl">🧠</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Course Quiz</h3>
            </div>
            {quiz && quiz.questions.length > 0 && (
              <span className="inline-flex items-center px-2 sm:px-3 py-1 bg-purple-200 text-purple-800 text-xs sm:text-sm font-semibold rounded-full shadow-sm">
                {quiz.questions.length} {quiz.questions.length === 1 ? "Question" : "Questions"}
              </span>
            )}
          </div>

          {quiz && quiz.questions.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {quiz.questions.map((question, index) => (
                <div
                  key={question.questionId}
                  className="bg-gradient-to-r from-purple-50 to-pink-50/20 border border-purple-200 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shadow-md">
                        Q{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 sm:space-y-4">
                      <p className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                        {question.questionText}
                      </p>

                      <div className="space-y-2" aria-describedby={`correct-answer-${question.questionId}`}>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Options:</p>
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 sm:p-3 rounded-xl border shadow-sm transition-all duration-200 ${
                              option === question.correctAnswer
                                ? "bg-green-300 border-2 border-green-300 text-green-800 hover:scale-[1.03]"
                                : "bg-gray-50 border-gray-200 text-gray-700 hover:scale-[1.02]"
                            }`}
                            aria-label={option === question.correctAnswer ? `Correct answer: ${option}` : `Option: ${option}`}
                          >
                            <div className="flex items-center">
                              {option === question.correctAnswer && (
                                <span className="text-green-600 mr-1 sm:mr-2">
                                  <CheckCircle size={14} className="sm:size-16" />
                                </span>
                              )}
                              <span className="font-medium mr-1 sm:mr-2">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span className={`text-sm sm:text-base ${option === question.correctAnswer ? "font-semibold" : ""}`}>
                                {option}
                              </span>
                              {option === question.correctAnswer && (
                                <span className="ml-auto text-xs sm:text-sm bg-green-400 text-green-900 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold shadow-sm">
                                  Correct
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="mt-3">
                          <p
                            id={`correct-answer-${question.questionId}`}
                            className="text-sm sm:text-base font-semibold text-green-700 bg-green-100 p-2 sm:p-3 rounded-lg"
                          >
                            Correct Answer: {question.correctAnswer}
                          </p>
                          {!question.options.includes(question.correctAnswer) && (
                            <p className="text-xs sm:text-sm text-red-600 bg-red-100 p-2 sm:p-3 rounded-lg mt-2">
                              Note: The correct answer does not match any provided options.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 sm:py-12">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">❓</span>
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Quiz Questions Yet</h4>
              <p className="text-sm sm:text-base text-gray-500">
                Quiz questions will appear here once they are added to the course.
              </p>
            </div>
          )}
        </div>

        {/* Verification Section */}
        {course.isSubmitted && !course.isVerified && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8 animate-fade-in">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Shield size={20} className="text-white sm:size-24" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Course Verification</h3>
            </div>
            <div className="space-y-4">
              {showRejectReason && (
                <div>
                  <label htmlFor="rejectReason" className="block font-medium text-gray-700">
                    Rejection Reason (Required)
                  </label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter the reason for rejection"
                  />
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectReason(false);
                    handleVerify("approve");
                  }}
                  disabled={verifying}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:ring-2 focus:ring-green-500"
                  aria-label={verifying ? "Verifying..." : "Approve Course"}
                >
                  <Check size={14} className="mr-2 sm:size-16" />
                  <span className="hidden sm:inline">{verifying ? "Verifying..." : "Approve Course"}</span>
                  <span className="sm:hidden">Approve</span>
                </button>
                <button
                  onClick={() => {
                    setShowRejectReason(true);
                    if (showRejectReason) {
                      handleVerify("reject");
                    }
                  }}
                  disabled={verifying || (showRejectReason && !rejectReason.trim())}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:ring-2 focus:ring-red-500"
                  aria-label={verifying ? "Verifying..." : showRejectReason ? "Submit Rejection" : "Reject Course"}
                >
                  <X size={14} className="mr-2 sm:size-16" />
                  <span className="hidden sm:inline">
                    {verifying ? "Verifying..." : showRejectReason ? "Submit Rejection" : "Reject Course"}
                  </span>
                  <span className="sm:hidden">{showRejectReason ? "Submit" : "Reject"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseDetailPage;