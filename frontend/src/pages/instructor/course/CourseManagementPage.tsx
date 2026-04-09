import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  instructorGetCourseById,
  publishCourse,
  submitCourseForVerification,
} from "../../../api/action/InstructorActionApi";
import Card from "../../../components/common/Card";
import Modal from "react-modal";
import type { CourseManagement } from "../interface/instructorInterface";
import { AxiosError } from "axios";
import { Star } from "lucide-react";

Modal.setAppElement("#root");

const CourseManagementPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseManagement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [publishDate, setPublishDate] = useState<string>("");

  // Wrap fetchCourseDetails in useCallback to fix dependency warning
  const fetchCourseDetails = useCallback(async () => {
    if (!courseId) {
      toast.error("Course ID is missing");
      return;
    }
    try {
      setLoading(true);
      const res = await instructorGetCourseById(courseId);
      if (res?.success && res.data) {
        setCourse(res.data);
      } else {
        throw new Error("Invalid response data");
      }
    } catch {
      toast.error("Failed to load course details");
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const handleOpenPublishModal = () => {
    if (!course?.isVerified) {
      toast.info("Course must be verified before publishing");
      return;
    }
    setIsModalOpen(true);
    if (course?.publishDate) {
      try {
        // Handle the date format from backend
        const publishDateStr = course.publishDate;
        setPublishDate(publishDateStr);
      } catch (error) {
        console.error("Error parsing publishDate:", error);
        setPublishDate("");
      }
    } else {
      setPublishDate("");
    }
  };

  const handleClosePublishModal = () => {
    setIsModalOpen(false);
    setPublishDate("");
  };

  const handleImmediatePublish = async () => {
    if (!courseId) {
      toast.error("Course ID is missing");
      return;
    }
    try {
      const res = await publishCourse(courseId);
      toast.success(res?.message || "Course published successfully");
      await fetchCourseDetails();
      handleClosePublishModal();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errMsg = error?.response?.data?.message || "Publish failed";
        toast.error(errMsg);
      }
    }
  };

  const handleLatePublish = async () => {
    if (!courseId) {
      toast.error("Course ID is missing");
      return;
    }
    if (!publishDate) {
      toast.error("Please select a publish date and time");
      return;
    }
    const selectedDate = new Date(publishDate);
    const now = new Date();
    if (selectedDate <= now) {
      toast.error("Publish date must be in the future");
      return;
    }

    try {
      const publishDateWithTimezone = `${publishDate}:00+05:30`;      
      const res = await publishCourse(courseId, publishDateWithTimezone);
      toast.success(res?.message || "Course scheduled for publishing");
      await fetchCourseDetails();
      handleClosePublishModal();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errMsg = error?.response?.data?.message || "Failed to schedule publish";
        toast.error(errMsg);
      }
    }
  };

  const handleCancelSchedule = async () => {
    if (!courseId) {
      toast.error("Course ID is missing");
      return;
    }
    try {
      const res = await publishCourse(courseId);
      toast.success(res?.message || "Publish schedule canceled");
      await fetchCourseDetails();
      handleClosePublishModal();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errMsg = error?.response?.data?.message || "Failed to cancel schedule";
        toast.error(errMsg);
      }
    }
  };

  const handleSubmitForVerification = async () => {
    if (!courseId) {
      toast.error("Course ID is missing");
      return;
    }
    try {
      const res = await submitCourseForVerification(courseId);
      toast.success(res?.message || "Course submitted for verification");
      await fetchCourseDetails();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const errMsg = error?.response?.data?.message || "Failed to submit course for verification";
        toast.error(errMsg);
      }
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDuration = (seconds?: string) => {
    const secs = parseInt(seconds || "0") || 0;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8 text-red-500">Course not found</div>
    );
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
            <p>{course.categoryName}</p>
          </div>
          <div>
            <p className="font-semibold">Level:</p>
            <p>{course.level}</p>
          </div>
          <div>
            <p className="font-semibold">Duration:</p>
            <p className="font-medium text-blue-600">
              {formatDuration(course.duration)}
            </p>
          </div>
          <div>
            <p className="font-semibold">Price:</p>
            <p>₹{course.price}</p>
          </div>
          <div>
            <p className="font-semibold">Verification Status:</p>
            <p className={course.isVerified ? "text-green-600" : "text-yellow-600"}>
              {course.isVerified ? "✓ Verified" : "Not Verified"}
            </p>
          </div>
          <div>
            <p className="font-semibold">Submitted for Verification:</p>
            <p>{course.isSubmitted ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="font-semibold">Published:</p>
            <p className={course.isPublished ? "text-green-600" : "text-gray-600"}>
              {course.isPublished ? "Yes" : "No"}
            </p>
          </div>
          {course.review && (
            <div className="col-span-2">
              <p className="font-semibold text-red-600">Admin Review:</p>
              <p className="bg-red-50 p-2 rounded">{course.review}</p>
            </div>
          )}
          <div className="col-span-2">
            <p className="font-semibold">Description:</p>
            <p className="whitespace-pre-wrap text-gray-700">{course.description}</p>
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
          {course.demoVideoUrlSigned && (
            <div className="col-span-2">
              <p className="font-semibold mb-2">Demo Video:</p>
              <video
                src={course.demoVideoUrlSigned}
                controls
                className="w-full max-w-md rounded shadow-md"
              />
            </div>
          )}
          {course.publishDate && (
            <div className="col-span-2">
              <p className="font-semibold">Scheduled Publish Date:</p>
              <p className="text-blue-600 font-medium">{course.publishDate}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
        <button
          onClick={() => navigate(`/instructor/course/${courseId}/modules`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow transition-all"
        >
          📚 View Modules
        </button>
        {!course.isSubmitted && !course.isVerified && (
          <button
            onClick={handleSubmitForVerification}
            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow transition-all"
          >
            📝 Submit for Verification
          </button>
        )}
        {course.isPublished ? (
          <>
            <button
              disabled
              className="bg-green-600 text-white px-5 py-2 rounded-md text-sm font-medium shadow opacity-70 cursor-not-allowed"
            >
              ✅ Course Published
            </button>

            <button
              onClick={() => navigate(`/instructor/courses/${courseId}/reviews`)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow flex items-center gap-2 transition-all"
            >
              <Star className="w-4 h-4" />
              View Reviews
            </button>
          </>
        ) : course.publishDate ? (
          <button
            onClick={handleOpenPublishModal}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow transition-all"
          >
            📅 Edit Publish Schedule
          </button>
        ) : (
          <button
            onClick={handleOpenPublishModal}
            disabled={!course.isVerified}
            className={`bg-yellow-600 text-white px-5 py-2 rounded-md text-sm font-medium shadow transition-all ${
              !course.isVerified
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-yellow-700"
            }`}
          >
            🚀 Publish Course
          </button>
        )}
        <button
          onClick={() => navigate(`/instructor/courseDashboard/${courseId}`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow transition-all"
        >
          📊 View Course Dashboard
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleClosePublishModal}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start"
      >
        <h2 className="text-xl font-semibold mb-4">
          {course.publishDate ? "Edit Publish Schedule" : "Publish Course"}
        </h2>
        <div className="space-y-4">
          <button
            onClick={handleImmediatePublish}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Publish Now
          </button>
          
          <div className="border-t pt-4">
            <label className="block font-medium mb-2 text-gray-700">
              Or Schedule for Later (IST)
            </label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={getMinDateTime()}
            />
            <p className="text-xs text-gray-500 mt-1">
              Select date and time in Indian Standard Time (IST)
            </p>
            <button
              onClick={handleLatePublish}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!publishDate}
            >
              Schedule Publish
            </button>
          </div>

          {course.publishDate && (
            <button
              onClick={handleCancelSchedule}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Cancel Schedule & Publish Now
            </button>
          )}
          
          <button
            onClick={handleClosePublishModal}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CourseManagementPage;