import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEnrolledCourses,
  getCertificate,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";

interface Course {
  _id: string;
  courseName: string;
  thumbnailUrl: string;
  price: number;
}

interface Enrollment {
  _id: string;
  courseId: Course;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  certificateGenerated: boolean;
}

const EnrolledCoursesPage = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
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
      <p className="p-6 text-center text-gray-600">
        Loading enrolled courses...
      </p>
    );

  if (enrollments.length === 0)
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-3">No Enrolled Courses</h2>
        <p className="text-gray-600 mb-4">
          Browse and enroll in a course to see it here.
        </p>
        <button
          onClick={() => navigate("/user/courses")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md"
        >
          Browse Courses
        </button>
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">🎓 Your Enrolled Courses</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {enrollments.map((enroll) => {
          const course = enroll.courseId;
          const isCompleted = enroll.completionStatus === "COMPLETED";

          return (
            <div
              key={enroll._id}
              className="bg-white border rounded-lg shadow hover:shadow-md transition duration-300 flex flex-col"
            >
              <img
                src={course.thumbnailUrl}
                alt={course.courseName}
                className="h-44 w-full object-cover rounded-t-lg"
              />

              <div className="flex-grow p-4 flex flex-col justify-between">
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/user/enrolled/${course._id}`)}
                >
                  <h3 className="text-xl font-semibold mb-1">
                    {course.courseName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        isCompleted
                          ? "text-green-600"
                          : enroll.completionStatus === "IN_PROGRESS"
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      {enroll.completionStatus.toLowerCase()}
                    </span>
                  </p>
                  <p className="text-right font-bold text-blue-600 mb-2">
                    ₹{course.price}
                  </p>
                </div>

                {enroll.certificateGenerated ? (
                  <button
                    onClick={() => handleDownloadCertificate(course._id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded mt-2"
                  >
                    🎓 Download Certificate
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-600 text-sm px-4 py-2 rounded mt-2 cursor-not-allowed"
                  >
                    Certificate Not Ready
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
