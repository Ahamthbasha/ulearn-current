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
  BarChart3,
  Eye,
  Globe,
  Shield,
  PlayCircle,
  Check,
  X,
  BookOpen,
  Video,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import type { AxiosError } from "axios";
import type { CourseDetailsResponse } from "../interface/adminCourseDetailInterface";


// === Component ===
const AdminCourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState<CourseDetailsResponse | null>(
    null
  );
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
      toast.success(
        `Course ${action === "approve" ? "approved" : "rejected"} successfully`
      );
      await fetchCourseDetails();
      setRejectReason("");
      setShowRejectReason(false);
    } catch (err: unknown) {
      console.error("Failed to verify course", err);
      let message = "Verification failed";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        if (axiosErr.response?.data?.message) {
          message = axiosErr.response.data.message;
        }
      }
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-700 font-medium text-lg">
            Loading Course Details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-sm border border-red-200 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Course
          </h3>
          <p className="text-gray-600 mb-6">{error || "Course not found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-medium shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    courseName,
    description,
    durationFormat,
    price,
    level,
    thumbnailUrl,
    demoVideo,
    isPublished,
    isListed,
    isSubmitted,
    isVerified,
    modules,
    instructorName,
    categoryName,
  } = courseData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sticky Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-medium"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-8 w-px bg-gray-300" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">
                {courseName}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight">
                  {courseName}
                </h2>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  {description}
                </p>
                <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-500">
                  {instructorName && (
                    <span className="flex items-center">
                      <strong className="mr-1">Instructor:</strong>{" "}
                      {instructorName}
                    </span>
                  )}
                  {categoryName && (
                    <span className="flex items-center">
                      <strong className="mr-1">Category:</strong> {categoryName}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-3">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                    isListed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <Eye size={16} className="mr-2" />{" "}
                  {isListed ? "Listed" : "Unlisted"}
                </span>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                    isPublished
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <Globe size={16} className="mr-2" />{" "}
                  {isPublished ? "Published" : "Draft"}
                </span>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                    isVerified
                      ? "bg-purple-100 text-purple-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <Shield size={16} className="mr-2" />{" "}
                  {isVerified ? "Verified" : "Pending"}
                </span>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                    isSubmitted
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <CheckCircle size={16} className="mr-2" />{" "}
                  {isSubmitted ? "Submitted" : "Not Submitted"}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Price</p>
                      <p className="text-2xl font-bold">₹{price}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Level</p>
                      <p className="text-2xl font-bold capitalize">{level}</p>
                    </div>
                    <BarChart3 size={28} />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-5 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Duration</p>
                      <p className="text-2xl font-bold">{durationFormat}</p>
                    </div>
                    <Clock size={28} />
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="relative group">
              {thumbnailUrl ? (
                <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                  <img
                    src={thumbnailUrl}
                    alt="Course Thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white font-semibold text-lg">
                      Course Preview
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <PlayCircle className="w-16 h-16 text-blue-600 mx-auto mb-3" />
                    <p className="text-blue-700 font-semibold text-lg">
                      No Thumbnail
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Demo Video */}
        {demoVideo && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <PlayCircle size={28} className="text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Demo Video
              </h3>
            </div>
            <div className="aspect-[16/9] bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
              <video
                controls
                className="w-full h-full object-cover"
                poster={thumbnailUrl}
              >
                <source src={demoVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Modules & Chapters */}
        <div className="space-y-8">
          {modules.map((module) => (
            <div
              key={module.moduleId}
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 p-6 lg:p-8 transition-all hover:shadow-3xl"
            >
              {/* Module Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen size={30} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="text-indigo-600 font-extrabold">
                        Module {module.moduleNumber}
                      </span>
                      <span className="text-gray-700">
                        : {module.moduleTitle}
                      </span>
                    </h3>
                    <p className="text-gray-600 mt-1">{module.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Module Duration</p>
                  <p className="text-xl font-bold text-orange-600">
                    {module.durationFormat}
                  </p>
                </div>
              </div>

              {/* Chapters */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Video size={20} className="mr-2 text-blue-600" />
                  Chapters ({module.chaptersCount})
                </h4>
                {module.chapters && module.chapters.length > 0 ? (
                  <div className="space-y-6">
                    {module.chapters.map((chapter) => (
                      <div
                        key={chapter.chapterId}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Chapter Info */}
                          <div>
                            <h5 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                              <span className="text-blue-600 font-extrabold">
                                Chapter {chapter.chapterNumber}
                              </span>
                              <span className="text-gray-700">
                                : {chapter.chapterTitle}
                              </span>
                            </h5>
                            <p className="text-sm text-gray-600 mb-3">
                              {chapter.description}
                            </p>
                            <p className="text-sm font-medium text-orange-600 flex items-center">
                              <Clock size={16} className="mr-1" />
                              {chapter.durationFormat}
                            </p>
                          </div>

                          {/* Chapter Video - SAME AS DEMO */}
                          {chapter.videoUrl && (
                            <div className="aspect-[16/9] bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
                              <video
                                controls
                                className="w-full h-full object-cover"
                              >
                                <source
                                  src={chapter.videoUrl}
                                  type="video/mp4"
                                />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No chapters in this module.
                  </p>
                )}
              </div>

              {/* Quiz */}
              {module.quiz && module.quiz.questions.length > 0 && (
                <div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <HelpCircle size={20} className="mr-2 text-purple-600" />
                    Quiz ({module.quizCount} Questions)
                  </h4>
                  <div className="space-y-4">
                    {module.quiz.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-5 shadow-md"
                      >
                        <p className="font-semibold text-gray-900 mb-3">
                          Q{idx + 1}. {q.questionText}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-xl border-2 font-medium transition-all ${
                                opt === q.correctAnswer
                                  ? "bg-emerald-100 border-emerald-500 text-emerald-800"
                                  : "bg-white border-gray-200 text-gray-700"
                              }`}
                            >
                              <span className="mr-2">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt}
                              {opt === q.correctAnswer && (
                                <span className="ml-3 text-xs bg-emerald-600 text-white px-2 py-1 rounded-full">
                                  Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Verification */}
        {isSubmitted && !isVerified && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 p-6 lg:p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield size={30} className="text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Course Verification
              </h3>
            </div>

            <div className="space-y-5">
              {showRejectReason && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-4 border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    rows={5}
                    placeholder="Explain why this course is being rejected..."
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => handleVerify("approve")}
                  disabled={verifying}
                  className="flex-1 flex items-center justify-center py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg disabled:opacity-60"
                >
                  <Check size={20} className="mr-2" />
                  {verifying ? "Approving..." : "Approve Course"}
                </button>
                <button
                  onClick={() => {
                    if (showRejectReason && rejectReason.trim()) {
                      handleVerify("reject");
                    } else {
                      setShowRejectReason(true);
                    }
                  }}
                  disabled={
                    verifying || (showRejectReason && !rejectReason.trim())
                  }
                  className="flex-1 flex items-center justify-center py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all shadow-lg disabled:opacity-60"
                >
                  <X size={20} className="mr-2" />
                  {showRejectReason
                    ? verifying
                      ? "Rejecting..."
                      : "Submit Rejection"
                    : "Reject Course"}
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
