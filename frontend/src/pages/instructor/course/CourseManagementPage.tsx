import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  instructorGetCourseById,
  publishCourse,
} from "../../../api/action/InstructorActionApi";
import Card from "../../../components/common/Card";
import Modal from "react-modal";
import type { CourseManagement } from "../interface/instructorInterface";

Modal.setAppElement("#root");

const CourseManagementPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseManagement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [publishDate, setPublishDate] = useState<string>("");

  const fetchCourseDetails = async () => {
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
    } catch (error) {
      toast.error("Failed to load course details");
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const handleOpenPublishModal = () => {
    setIsModalOpen(true);
    if (course?.publishDate) {
      try {
        // Parse the backend's publishDate (format: DD-MM-YYYY hh:mm AM/PM)
        const match = course.publishDate.match(/^(\d{2})-(\d{2})-(\d{4})\s(\d{1,2}):(\d{2})\s(AM|PM)$/);
        if (!match) {
          console.error("Date format mismatch:", course.publishDate);
          setPublishDate("");
          return;
        }

        const [, day, month, year, hours, minutes, ampm] = match;
        let hours24 = parseInt(hours, 10);
        if (ampm === "PM" && hours24 !== 12) {
          hours24 += 12;
        } else if (ampm === "AM" && hours24 === 12) {
          hours24 = 0;
        }

        // Create Date object in IST (Asia/Kolkata)
        const date = new Date(Date.UTC(+year, +month - 1, +day, hours24, +minutes));
        if (isNaN(date.getTime())) {
          console.error("Invalid date parsed from:", course.publishDate);
          setPublishDate("");
          return;
        }

        // Format to YYYY-MM-DDThh:mm for datetime-local
        const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hours24
          .toString()
          .padStart(2, "0")}:${minutes.padStart(2, "0")}`;
        setPublishDate(formattedDate);
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
      const res = await publishCourse(courseId); // No publishDate for immediate
      toast.success(res?.message || "Course published successfully");
      await fetchCourseDetails(); // Refresh to reflect isPublished
      handleClosePublishModal();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Publish failed";
      toast.error(errMsg);
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
    if (selectedDate < new Date()) {
      toast.error("Publish date cannot be in the past");
      return;
    }
    try {
      const res = await publishCourse(courseId, publishDate);
      toast.success(res?.message || "Course scheduled for publishing");
      await fetchCourseDetails(); // Refresh to reflect publishDate
      handleClosePublishModal();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Failed to schedule publish";
      toast.error(errMsg);
    }
  };

  const handleCancelSchedule = async () => {
    if (!courseId) {
      toast.error("Course ID is missing");
      return;
    }
    try {
      const res = await publishCourse(courseId); // Send null to clear publishDate
      toast.success(res?.message || "Publish schedule canceled");
      await fetchCourseDetails(); // Refresh to reflect no publishDate
      handleClosePublishModal();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Failed to cancel schedule";
      toast.error(errMsg);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading course details...</div>;
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
              <p>{course.publishDate}</p>
            </div>
          )}
        </div>
      </Card>

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
        {course.isPublished ? (
          <button
            disabled
            className="bg-green-600 text-white px-5 py-2 rounded-md text-sm font-medium shadow opacity-70 cursor-not-allowed"
          >
            ✅ Course Published
          </button>
        ) : course.publishDate ? (
          <button
            onClick={handleOpenPublishModal}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-md text-sm font-medium shadow"
          >
            ✏️ Edit Publish
          </button>
        ) : (
          <button
            onClick={handleOpenPublishModal}
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
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Immediate Publish
          </button>
          <div className="space-y-2">
            <label className="block font-medium">Schedule Publish</label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              min={new Date().toISOString().slice(0, 16)} // Prevent past dates
            />
            <button
              onClick={handleLatePublish}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              disabled={!publishDate}
            >
              Schedule Publish
            </button>
          </div>
          {course.publishDate && (
            <button
              onClick={handleCancelSchedule}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Cancel Schedule
            </button>
          )}
          <button
            onClick={handleClosePublishModal}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CourseManagementPage;