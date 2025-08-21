import { useEffect, useState, useRef } from "react";
import { useFormik, FormikProvider } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import { toast } from "react-toastify";

import InputField from "../../../components/common/InputField";
import {
  instructorGetCourseById,
  instructorUpdateCourse,
  getInstructorCategories,
} from "../../../api/action/InstructorActionApi";

const MAX_VIDEO_SIZE_MB = 200;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const CourseEditPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<
    { _id: string; categoryName: string }[]
  >([]);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<
    string | null
  >(null);
  const [existingDemoVideoUrl, setExistingDemoVideoUrl] = useState<
    string | null
  >(null);
  const [thumbnailError, setThumbnailError] = useState("");
  const [videoError, setVideoError] = useState("");

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    initialValues: {
      courseName: "",
      description: "",
      category: "",
      price: "",
      duration: "",
      level: "",
      thumbnail: null,
      demoVideo: null,
    },
    validationSchema: Yup.object({
      courseName: Yup.string()
        .trim()
        .min(6, "Course name must be at least 6 characters")
        .max(30, "Course name must not exceed 20 characters")
        .matches(
          /^[A-Za-z ]{6,30}$/,
          "Only letters and spaces allowed, 6-20 characters"
        )
        .test("not-only-spaces", "Course name cannot be just spaces", (value) =>
          Boolean(value && value.trim().replace(/\s/g, "").length >= 6)
        )
        .required("Course name is required"),

      description: Yup.string()
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(50, "Description must not exceed 50 characters")
        .matches(
          /^(?![\d\s\W]+$)[A-Za-z0-9\s.,;:'"()\-?!]{10,50}$/,
          "Description must include meaningful text, not just symbols or numbers"
        )
        .test(
          "not-repetitive-symbols",
          "Description must contain letters or meaningful words",
          (value) => {
            if (!value) return false;
            const stripped = value.replace(/[\s\d\W_]+/g, "");
            return stripped.length >= 5; // At least 5 letters
          }
        )
        .required("Description is required"),

      category: Yup.string().required("Category is required"),

      price: Yup.number()
        .typeError("Price must be a number")
        .positive("Price must be greater than zero")
        .min(1, "Price must be at least ₹1")
        .max(999999, "Price cannot exceed ₹9,99,999")
        .test("decimal-places", "Price can have maximum 2 decimal places", (value) => {
          if (!value) return true;
          const decimalPlaces = value.toString().split('.')[1];
          return !decimalPlaces || decimalPlaces.length <= 2;
        })
        .required("Price is required"),

      duration: Yup.string()
        .matches(/^[1-9][0-9]*$/, "Duration must be a positive number")
        .test("duration-range", "Duration must be between 1-999 hours", (value) => {
          if (!value) return false;
          const num = parseInt(value);
          return num >= 1 && num <= 999;
        })
        .required("Duration is required"),

      level: Yup.string()
        .oneOf(["Beginner", "Intermediate", "Advanced"], "Invalid level")
        .required("Level is required"),
    }),
    onSubmit: async (values) => {
      const formData = new FormData();
      formData.append("courseName", values.courseName.trim());
      formData.append("description", values.description.trim());
      formData.append("category", values.category);
      formData.append("price", values.price.toString());
      formData.append("duration", values.duration);
      formData.append("level", values.level);

      if (values.thumbnail) formData.append("thumbnail", values.thumbnail);
      if (values.demoVideo) formData.append("demoVideos", values.demoVideo);

      setSubmitting(true);
      try {
        const res = await instructorUpdateCourse(courseId!, formData);
        toast.success(res.message);
        navigate("/instructor/courses");
      } catch (error: any) {
        toast.error(error?.response?.data.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const [courseRes, categoryRes] = await Promise.all([
          instructorGetCourseById(courseId!),
          getInstructorCategories(),
        ]);

        const course = courseRes?.data;
        const categories = categoryRes || [];

        // Find the category ID by matching the categoryName
        const matchingCategory = categories.find(
          (cat) => cat.categoryName === course.categoryName
        );

        // Normalize level value to match validation schema
        const normalizeLevel = (level: string) => {
          if (!level) return "";
          const normalized = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
          return ["Beginner", "Intermediate", "Advanced"].includes(normalized) ? normalized : "";
        };

        formik.setValues({
          courseName: course.courseName || "",
          description: course.description || "",
          category: matchingCategory?._id || "",
          price: course.price || "",
          duration: course.duration || "",
          level: normalizeLevel(course.level || ""),
          thumbnail: null,
          demoVideo: null,
        });

        setExistingThumbnailUrl(course.thumbnailSignedUrl || null);
        setExistingDemoVideoUrl(course.demoVideoUrlSigned || null);
        setCategories(categories);
        setInitialLoading(false);
      } catch (err) {
        toast.error("Failed to load course");
        navigate("/instructor/courses");
      }
    })();
  }, [courseId]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setThumbnailError("Only JPG, PNG, WEBP images are allowed");
      formik.setFieldValue("thumbnail", null);
      e.currentTarget.value = "";
      return;
    }

    setThumbnailError("");
    formik.setFieldValue("thumbnail", file);

    const reader = new FileReader();
    reader.onload = () => setExistingThumbnailUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setVideoError("Only MP4, WEBM, or QuickTime videos are allowed");
      formik.setFieldValue("demoVideo", null);
      e.currentTarget.value = "";
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setVideoError(`Video size must be under ${MAX_VIDEO_SIZE_MB}MB`);
      formik.setFieldValue("demoVideo", null);
      e.currentTarget.value = "";
      return;
    }

    setVideoError("");
    formik.setFieldValue("demoVideo", file);

    const reader = new FileReader();
    reader.onload = () => setExistingDemoVideoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (initialLoading) return <p className="p-4">Loading...</p>;

  return (
    <FormikProvider value={formik}>
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-bold mb-4">Edit Course</h2>

        <InputField name="courseName" label="Course Name" />
        <InputField name="description" label="Description" />

        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select
            name="category"
            value={formik.values.category}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 border-2 focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select Category
            </option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.categoryName}
              </option>
            ))}
          </select>
          {formik.touched.category && formik.errors.category && (
            <p className="text-red-500 text-sm">{formik.errors.category}</p>
          )}
        </div>

        <InputField name="price" label="Price" type="number" />
        <InputField name="duration" label="Duration (in hours)" />

        <div>
          <label className="block mb-1 font-medium">Level</label>
          <select
            name="level"
            value={formik.values.level}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 border-2 focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select Level
            </option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          {formik.touched.level && formik.errors.level && (
            <p className="text-red-500 text-sm">{formik.errors.level}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Thumbnail</label>
          {existingThumbnailUrl && (
            <img
              src={existingThumbnailUrl}
              alt="Thumbnail Preview"
              className="max-w-xs max-h-52 object-contain rounded border mb-2"
            />
          )}
          <input
            ref={thumbnailInputRef}
            type="file"
            name="thumbnail"
            accept="image/*"
            onChange={handleThumbnailChange}
          />
          {thumbnailError && (
            <p className="text-red-500 text-sm">{thumbnailError}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Demo Video</label>
          {existingDemoVideoUrl && (
            <video
              src={existingDemoVideoUrl}
              controls
              className="w-full h-52 rounded mb-2"
            />
          )}
          <input
            ref={videoInputRef}
            type="file"
            name="demoVideo"
            accept="video/*"
            onChange={handleVideoChange}
          />
          {videoError && <p className="text-red-500 text-sm">{videoError}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg shadow text-white ${
            submitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Updating...
            </>
          ) : (
            "Update Course"
          )}
        </button>
      </form>
    </FormikProvider>
  );
};

export default CourseEditPage;