import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLearningPathDetails, completeCourseAndUnlockNext } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { Loader2, BookOpen, CheckCircle, Clock, Lock, Award } from "lucide-react";
import {type LearningPathDetails } from "../interface/studentInterface";
import type { ApiError } from "../../../types/interfaces/ICommon";

const LmsCourseListPage = () => {
  const [learningPath, setLearningPath] = useState<LearningPathDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { learningPathId } = useParams<{ learningPathId: string }>();

  useEffect(() => {
    const fetchLearningPathDetails = async () => {
      if (!learningPathId) {
        toast.error("Invalid learning path ID");
        setLoading(false);
        return;
      }

      try {
        const response = await getLearningPathDetails(learningPathId);
        setLearningPath(response);
      } catch (error) {
        toast.error("Failed to load learning path details");
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPathDetails();
  }, [learningPathId]);

  const handleCompleteCourse = async (courseId: string) => {
    if (!learningPathId) return;
    try {
      await completeCourseAndUnlockNext(courseId, learningPathId);
      toast.success("Course completed and next course unlocked!");
      const response = await getLearningPathDetails(learningPathId);
      setLearningPath(response);
    } 
    catch (error) {
  const apiError = error as ApiError;
  const errorMessage = apiError.response?.data?.message || "Failed to complete course";
  toast.error(errorMessage);
}
  };

  const handleViewCertificate = (certificateUrl: string) => {
    try {
      const link = document.createElement("a");
      link.href = certificateUrl;
      link.download = `certificate-${Date.now()}.pdf`; // Suggest a filename for the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Certificate download started!");
    } catch (error) {
      toast.error("Failed to start certificate download");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading learning path courses...</p>
        </div>
      </div>
    );

  if (!learningPath || learningPath.courses.length === 0)
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto text-center bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🎓 No Courses Available
          </h2>
          <p className="text-gray-600 italic mb-6 text-base sm:text-lg">
            This learning path has no courses or could not be loaded.
          </p>
          <button
            onClick={() => navigate("/user/enrolledLms")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-300 text-base sm:text-lg"
          >
            <BookOpen className="inline mr-2 h-5 w-5" /> Back to Learning Paths
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 flex items-center">
        <BookOpen className="mr-2 text-blue-600" /> 🎓 Learning Path Courses
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {learningPath.courses
          .sort((a, b) => a.order - b.order)
          .map((course) => {
            const isUnlocked = learningPath.unlockedCourses.includes(course.courseId);
            const isCompleted = course.isCompleted;

            return (
              <div
                key={course.courseId}
                className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden"
              >
                <img
                  src={course.thumbnailUrl}
                  alt={course.courseName}
                  className="h-44 sm:h-48 md:h-56 w-full object-cover rounded-t-xl"
                />

                <div className="p-4 sm:p-6 flex-grow flex flex-col justify-between">
                  <div
                    className={`cursor-${isUnlocked ? "pointer" : "not-allowed"}`}
                    onClick={() =>
                      isUnlocked
                        ? navigate(`/user/enrolled/${course.courseId}`, { state: { learningPathId } })
                        : toast.info("Complete previous courses to unlock this course")
                    }
                  >
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.courseName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 italic">{course.description}</p>
                    <p className="text-sm sm:text-base text-gray-600 mb-2 flex items-center">
                      Status:{" "}
                      <span
                        className={`font-medium ml-1 ${
                          isCompleted
                            ? "text-green-600"
                            : isUnlocked
                            ? "text-yellow-600"
                            : "text-gray-500"
                        }`}
                      >
                        {isCompleted ? "completed" : isUnlocked ? "in_progress" : "locked"}
                      </span>
                      {isCompleted ? (
                        <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                      ) : isUnlocked ? (
                        <Clock className="ml-2 h-4 w-4 text-yellow-600" />
                      ) : (
                        <Lock className="ml-2 h-4 w-4 text-gray-500" />
                      )}
                    </p>
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${course.completionPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {course.completionPercentage}% Complete
                      </p>
                    </div>
                    <p className="text-right font-bold text-blue-600 text-lg sm:text-xl mb-4">
                      ₹{course.effectivePrice}
                    </p>
                  </div>

                  {isUnlocked && !isCompleted ? (
                    <button
                      onClick={() => handleCompleteCourse(course.courseId)}
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-sm sm:text-base px-4 py-2 rounded-lg shadow-md transition duration-300 flex items-center justify-center w-full"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                    </button>
                  ) : isCompleted && course.certificateUrl ? (
                    <button
                      onClick={() => handleViewCertificate(course.certificateUrl!)}
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-sm sm:text-base px-4 py-2 rounded-lg shadow-md transition duration-300 flex items-center justify-center w-full"
                    >
                      <Award className="mr-2 h-4 w-4" /> Download Certificate
                    </button>
                  ) : isCompleted ? (
                    <button
                      disabled
                      className="bg-gray-300 text-gray-600 text-sm sm:text-base px-4 py-2 rounded-lg cursor-not-allowed w-full flex items-center justify-center"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Completed
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-300 text-gray-600 text-sm sm:text-base px-4 py-2 rounded-lg cursor-not-allowed w-full flex items-center justify-center"
                    >
                      <Lock className="mr-2 h-4 w-4" /> Locked
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default LmsCourseListPage;