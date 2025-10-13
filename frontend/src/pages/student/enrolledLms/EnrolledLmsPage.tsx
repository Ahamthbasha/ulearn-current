import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEnrolledLearningPaths, getLearningPathCertificate } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import { Loader2, BookOpen, CheckCircle, Clock, Award } from "lucide-react";
import { type EnrolledLearningPath } from "../interface/studentInterface";

const EnrolledLmsPage = () => {
  const [enrollments, setEnrollments] = useState<EnrolledLearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrolled = async () => {
      try {
        const response = await getEnrolledLearningPaths();
        setEnrollments(response);
      } catch (error) {
        toast.error("Failed to load enrolled learning paths");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolled();
  }, []);

  const handleGetCertificate = async (learningPathId: string) => {
    try {
      const response = await getLearningPathCertificate(learningPathId);
      const certificateUrl = response.certificateUrl; // Extract URL from { data: { certificateUrl: string } }
      const link = document.createElement("a");
      link.href = certificateUrl;
      link.download = `learning-path-certificate-${Date.now()}.pdf`; // Suggest a filename for the download
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
          <p className="text-lg text-gray-700">Loading enrolled learning paths...</p>
        </div>
      </div>
    );

  if (enrollments.length === 0)
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto text-center bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🎓 No Enrolled Learning Paths
          </h2>
          <p className="text-gray-600 italic mb-6 text-base sm:text-lg">
            Start your learning journey by enrolling in a learning path today!
          </p>
          <button
            onClick={() => navigate("/user/lms")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-300 text-base sm:text-lg"
          >
            <BookOpen className="inline mr-2 h-5 w-5" /> Browse Learning Paths
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 flex items-center">
        <BookOpen className="mr-2 text-blue-600" /> 🎓 Your Enrolled Learning Paths
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.map((enroll) => {
          const isCompleted = enroll.learningPathCompleted;

          return (
            <div
              key={enroll.id}
              className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden"
            >
              <img
                src={enroll.presignedThumbnailUrl}
                alt={enroll.title}
                className="h-44 sm:h-48 md:h-56 w-full object-cover rounded-t-xl"
              />

              <div className="p-4 sm:p-6 flex-grow flex flex-col justify-between">
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/user/enrolledLms/${enroll.id}`)}
                >
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {enroll.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 italic">{enroll.description}</p>
                  <p className="text-sm text-gray-600 mb-2">Courses: {enroll.noOfCourses} | Hours: {enroll.noOfHours}</p>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 flex items-center">
                    Status:{" "}
                    <span
                      className={`font-medium ml-1 ${
                        isCompleted ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      {isCompleted ? "Completed" : "In Progress"}
                    </span>
                    {isCompleted ? (
                      <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="ml-2 h-4 w-4 text-yellow-600" />
                    )}
                  </p>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-1">Progress: {enroll.totalCompletionPercentageOfLearningPath}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${enroll.totalCompletionPercentageOfLearningPath}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-right font-bold text-blue-600 text-lg sm:text-xl mb-4">
                    ₹{enroll.totalPrice}
                  </p>
                </div>

                {isCompleted ? (
                  <button
                    onClick={() => handleGetCertificate(enroll.id)}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-sm sm:text-base px-4 py-2 rounded-lg shadow-md transition duration-300 flex items-center justify-center w-full"
                  >
                    <Award className="mr-2 h-4 w-4" /> Download Certificate
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-600 text-sm sm:text-base px-4 py-2 rounded-lg cursor-not-allowed w-full flex items-center justify-center"
                  >
                    <Clock className="mr-2 h-4 w-4" /> In Progress
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

export default EnrolledLmsPage;