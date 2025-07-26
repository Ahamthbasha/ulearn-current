import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCourseDetails,
  verifyCourse,
} from "../../../api/action/AdminActionApi";
import { ArrowLeft, CheckCircle, Clock, DollarSign, BarChart3, Eye, Globe, Shield,  PlayCircle } from "lucide-react";

interface Chapter {
  _id: string;
  chapterTitle: string;
  description: string;
  videoUrl: string;
}

interface Quiz {
  _id: string;
  questions: {
    questionText: string;
    correctAnswer: string;
  }[];
}

interface Course {
  _id: string;
  courseName: string;
  description: string;
  price: number;
  level: string;
  duration: string;
  isListed: boolean;
  isPublished: boolean;
  isVerified: boolean;
  demoVideo?: { url: string };
  thumbnailUrl?: string;
}

const AdminCourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const response = await getCourseDetails(courseId!);
      console.log(response);
      if (response?.data?.course) {
        setCourse(response.data.course);
        setChapters(response.data.chapters || []);
        setQuiz(response.data.quiz || null);
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

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await verifyCourse(courseId!);
      await fetchCourseDetails(); // Refresh state
    } catch (err) {
      console.error("Failed to verify course", err);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Course</h3>
          <p className="text-gray-600 mb-6">{error || "Course not found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back to Courses</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
                {course.courseName}
              </h1>
            </div>
            
            {!course.isVerified && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="inline-flex items-center px-4 sm:px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <CheckCircle size={16} className="mr-2" />
                <span className="hidden sm:inline">{verifying ? "Verifying..." : "Verify Course"}</span>
                <span className="sm:hidden">Verify</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              {/* Course Info */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    {course.courseName}
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-3">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                      course.isListed 
                        ? "bg-green-100 text-green-700 border border-green-200" 
                        : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    }`}
                  >
                    <Eye size={14} className="mr-2" />
                    {course.isListed ? "Listed" : "Not Listed"}
                  </span>
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                      course.isPublished 
                        ? "bg-blue-100 text-blue-700 border border-blue-200" 
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    <Globe size={14} className="mr-2" />
                    {course.isPublished ? "Published" : "Not Published"}
                  </span>
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                      course.isVerified 
                        ? "bg-purple-100 text-purple-700 border border-purple-200" 
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    <Shield size={14} className="mr-2" />
                    {course.isVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                        <DollarSign size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700">Price</p>
                        <p className="text-2xl font-bold text-green-900">₹{course.price}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <BarChart3 size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700">Level</p>
                        <p className="text-2xl font-bold text-blue-900">{course.level}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm border border-orange-200 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Clock size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-700">Duration</p>
                        <p className="text-2xl font-bold text-orange-900">{course.duration}h</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="lg:col-span-2">
                {course.thumbnailUrl ? (
                  <div className="relative group">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl">
                      <img
                        src={course.thumbnailUrl}
                        alt="Course Thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4">
                          <p className="text-white font-semibold">Course Preview</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <PlayCircle size={32} className="text-blue-600" />
                      </div>
                      <p className="text-blue-700 font-medium">No Thumbnail</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Video Section */}
        {course.demoVideo?.url && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <PlayCircle size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Demo Video</h3>
            </div>
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
              <video 
                controls 
                className="w-full h-full object-cover"
                poster={course.thumbnailUrl}
              >
                <source src={course.demoVideo.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Chapters Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Course Chapters</h3>
            </div>
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}
            </span>
          </div>
          
          {chapters.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-600 mb-2">No Chapters Yet</h4>
              <p className="text-gray-500">Chapters will appear here once they are added to the course.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {chapters.map((chapter, index) => (
                <div key={chapter._id} className="bg-gradient-to-r from-gray-50 to-blue-50/30 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">{chapter.chapterTitle}</h4>
                        <p className="text-gray-600 leading-relaxed">{chapter.description}</p>
                      </div>
                      
                      {chapter.videoUrl && (
                        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg">
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
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Course Quiz</h3>
            </div>
            {quiz && quiz.questions.length > 0 && (
              <span className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                {quiz.questions.length} {quiz.questions.length === 1 ? 'Question' : 'Questions'}
              </span>
            )}
          </div>
          
          {quiz && quiz.questions.length > 0 ? (
            <div className="space-y-6">
              {quiz.questions.map((question, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-lg">
                        Q{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-lg font-semibold text-gray-900">{question.questionText}</p>
                      <div className="bg-green-100 border border-green-200 rounded-xl p-4">
                        <p className="text-green-800 font-semibold flex items-center">
                          <span className="text-green-600 mr-2">✅</span>
                          Correct Answer: {question.correctAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">❓</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-600 mb-2">No Quiz Questions Yet</h4>
              <p className="text-gray-500">Quiz questions will appear here once they are added to the course.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCourseDetailPage;