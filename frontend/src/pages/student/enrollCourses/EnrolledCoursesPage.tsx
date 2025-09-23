import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEnrolledCourses,
  getCertificate,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { type EnrollmentWithDetail } from "../interface/studentInterface";
import { Loader2, BookOpen, CheckCircle, Clock, Download } from "lucide-react";

const EnrolledCoursesPage = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrolled = async () => {
      try {
        const response = await getEnrolledCourses();
        setEnrollments(response.courses);
      } catch (error) {
        toast.error("Failed to load enrolled courses");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolled();
  }, []);

  const handleDownloadCertificate = async (courseId: string) => {
    try {
      const response = await getCertificate(courseId);
      if (response.success && response.certificateUrl) {
        const link = document.createElement("a");
        link.href = response.certificateUrl;
        link.download = `certificate-${courseId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error(response.message || "Certificate not available yet");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to download certificate");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading enrolled courses...</p>
        </div>
      </div>
    );

  if (enrollments.length === 0)
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto text-center bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🎓 No Enrolled Courses
          </h2>
          <p className="text-gray-600 italic mb-6 text-base sm:text-lg">
            Start your learning journey by enrolling in a course today!
          </p>
          <button
            onClick={() => navigate("/user/courses")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-300 text-base sm:text-lg"
          >
            <BookOpen className="inline mr-2 h-5 w-5" /> Browse Courses
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 flex items-center">
        <BookOpen className="mr-2 text-blue-600" /> 🎓 Your Enrolled Courses
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.map((enroll) => {
          const course = enroll.courseId;
          const isCompleted = enroll.completionStatus === "COMPLETED";

          return (
            <div
              key={enroll._id}
              className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden"
            >
              <img
                src={course.thumbnailUrl}
                alt={course.courseName}
                className="h-44 sm:h-48 md:h-56 w-full object-cover rounded-t-xl"
              />

              <div className="p-4 sm:p-6 flex-grow flex flex-col justify-between">
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/user/enrolled/${course._id}`)}
                >
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.courseName}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 flex items-center">
                    Status:{" "}
                    <span
                      className={`font-medium ml-1 ${
                        isCompleted
                          ? "text-green-600"
                          : enroll.completionStatus === "IN_PROGRESS"
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      {enroll.completionStatus.toLowerCase()}
                    </span>
                    {isCompleted ? (
                      <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                    ) : enroll.completionStatus === "IN_PROGRESS" ? (
                      <Clock className="ml-2 h-4 w-4 text-yellow-600" />
                    ) : null}
                  </p>
                  <p className="text-right font-bold text-blue-600 text-lg sm:text-xl mb-4">
                    ₹{course.price}
                  </p>
                </div>

                {enroll.certificateGenerated ? (
                  <button
                    onClick={() => handleDownloadCertificate(course._id)}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-sm sm:text-base px-4 py-2 rounded-lg shadow-md transition duration-300 flex items-center justify-center w-full"
                  >
                    <Download className="mr-2 h-4 w-4" /> 🎓 Download Certificate
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-600 text-sm sm:text-base px-4 py-2 rounded-lg cursor-not-allowed w-full flex items-center justify-center"
                  >
                    <Clock className="mr-2 h-4 w-4" /> Certificate Not Ready
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

export default EnrolledCoursesPage;