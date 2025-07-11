import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { instructorGetCourseById, publishCourse } from "../../../api/action/InstructorActionApi";
import Card from "../../../components/common/Card";

const CourseManagementPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchCourseDetails = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await instructorGetCourseById(courseId);
      setCourse(res?.data || {});
    } catch (error) {
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const handlePublish = async () => {
    if (!courseId) return;
    try {
      const res = await publishCourse(courseId);
      toast.success(res?.message || "Course published successfully");
      fetchCourseDetails(); // refresh to reflect isPublished flag if needed
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Publish failed";
      toast.error(errMsg);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading course details...</div>;
  }

  if (!course) {
    return <div className="text-center py-8 text-red-500">Course not found</div>;
  }

  return (
    <div className="px-4 space-y-6">
      <Card title="Course Details" padded>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Course Name:</p>
            <p>{course.courseName}</p>
          </div>
          <div>
            <p className="font-semibold">Category:</p>
            <p>{course.category.categoryName}</p>
          </div>
          <div>
            <p className="font-semibold">Level:</p>
            <p>{course.level}</p>
          </div>
          <div>
            <p className="font-semibold">Duration:</p>
            <p>{course.duration} hours</p>
          </div>
          <div>
            <p className="font-semibold">Price:</p>
            <p>₹{course.price}</p>
          </div>
          <div className="col-span-2">
            <p className="font-semibold">Description:</p>
            <p className="whitespace-pre-wrap">{course.description}</p>
          </div>
          {course.thumbnailSignedUrl && (
            <div className="col-span-2">
              <p className="font-semibold mb-2">Thumbnail:</p>
              <img
                src={course.thumbnailSignedUrl}
                alt="Course Thumbnail"
                className="w-40 rounded shadow-md"
              />
            </div>
          )}
          {course.demoVideo?.urlSigned && (
            <div className="col-span-2">
              <p className="font-semibold mb-2">Demo Video:</p>
              <video
                src={course.demoVideo.urlSigned}
                controls
                className="w-full max-w-md rounded shadow-md"
              />
            </div>
          )}
        </div>
      </Card>

      {/* 📌 Navigation Buttons */}
      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
        <button
          onClick={() => navigate(`/instructor/course/${courseId}/chapters`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow"
        >
          📚 View Chapters
        </button>
        <button
          onClick={() => navigate(`/instructor/course/${courseId}/quiz`)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow"
        >
          🧠 View Quiz
        </button>

        {/* 🧪 Check Publish API Button */}
        {course.isPublished ? (
  <button
    disabled
    className="bg-green-600 text-white px-5 py-2 rounded-md text-sm font-medium shadow opacity-70 cursor-not-allowed"
  >
    ✅ Course Published
  </button>
) : (
  <button
    onClick={handlePublish}
    className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow"
  >
    🚀 Publish Course
  </button>
)}

<button
    onClick={() => navigate(`/instructor/courseDashboard/${courseId}`)}
    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow"
  >
    📊 View Course Dashboard
  </button>

      </div>
    </div>
  );
};

export default CourseManagementPage;
