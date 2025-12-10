import { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import { toast } from "react-toastify";

import {
  instructorGetCourseById,
  instructorUpdateCourse,
  getInstructorCategories,
} from "../../../api/action/InstructorActionApi";
import { AxiosError } from "axios";
import type { Category } from "../interface/instructorInterface";

const MAX_VIDEO_SIZE_MB = 200;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const CourseEditPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const [existingDemoVideoUrl, setExistingDemoVideoUrl] = useState<string | null>(null);
  const [courseDuration, setCourseDuration] = useState<string>("0");
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
      level: "",
      thumbnail: null as File | null,
      demoVideo: null as File | null,
    },
    validationSchema: Yup.object({
      courseName: Yup.string()
        .trim()
        .min(6, "Course name must be at least 6 characters")
        .max(30, "Course name must not exceed 30 characters")
        .matches(
          /^[A-Za-z ]{6,30}$/,
          "Only letters and spaces allowed, 6-30 characters"
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
          "Description must include meaningful text"
        )
        .test(
          "not-repetitive-symbols",
          "Description must contain letters or meaningful words",
          (value) => {
            if (!value) return false;
            const stripped = value.replace(/[\s\d\W_]+/g, "");
            return stripped.length >= 5;
          }
        )
        .required("Description is required"),

      category: Yup.string().required("Category is required"),

      price: Yup.number()
        .typeError("Price must be a number")
        .positive("Price must be greater than zero")
        .min(100, "Price must be at least ₹100")
        .max(999999, "Price cannot exceed ₹9,99,999")
        .test("decimal-places", "Max 2 decimal places", (value) => {
          if (!value) return true;
          const decimal = value.toString().split('.')[1];
          return !decimal || decimal.length <= 2;
        })
        .required("Price is required"),

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
      formData.append("level", values.level);

      if (values.thumbnail) formData.append("thumbnail", values.thumbnail);
      if (values.demoVideo) formData.append("demoVideos", values.demoVideo);

      setSubmitting(true);
      try {
        const res = await instructorUpdateCourse(courseId!, formData);
        toast.success(res.message || "Course updated successfully");
        navigate("/instructor/courses");
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message || "Failed to update course");
        } else {
          toast.error("An unexpected error occurred");
        }
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

        const matchedCategory = categories.find(
          (cat: Category) => cat._id === course.category?._id
        );

        const normalizeLevel = (level: string) => {
          if (!level) return "";
          const normalized = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
          return ["Beginner", "Intermediate", "Advanced"].includes(normalized) ? normalized : "";
        };

        formik.setValues({
          courseName: course.courseName || "",
          description: course.description || "",
          category: matchedCategory?._id || "",
          price: course.price || "",
          level: normalizeLevel(course.level || ""),
          thumbnail: null,
          demoVideo: null,
        });

        setExistingThumbnailUrl(course.thumbnailSignedUrl || null);
        setExistingDemoVideoUrl(course.demoVideo?.urlSigned || null);
        setCourseDuration(course.duration || "0");
        setCategories(categories);
        setInitialLoading(false);
      } catch (err) {
        toast.error("Failed to load course");
        navigate("/instructor/courses");
      }
    })();
  }, [courseId, navigate]);

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
      setVideoError("Only MP4, WEBM, or MOV videos are allowed");
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

  const formatDuration = (seconds: string) => {
    const secs = parseInt(seconds) || 0;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (initialLoading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading course details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">Edit</span> Edit Course
            </h1>
          </div>

          <div className="p-6 lg:p-8">
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* Course Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    name="courseName"
                    value={formik.values.courseName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  {formik.touched.courseName && formik.errors.courseName && (
                    <p className="mt-1 text-sm text-red-600">
                      Warning: {formik.errors.courseName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                  />
                  {formik.touched.description && formik.errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      Warning: {formik.errors.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
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
                    <p className="mt-1 text-sm text-red-600">
                      Warning: {formik.errors.category}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="price"
                      value={formik.values.price}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="999"
                    />
                  </div>
                  {formik.touched.price && formik.errors.price && (
                    <p className="mt-1 text-sm text-red-600">
                      Warning: {formik.errors.price}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <label
                        key={level}
                        className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          formik.values.level === level
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-gray-50 hover:border-blue-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="level"
                          value={level}
                          checked={formik.values.level === level}
                          onChange={formik.handleChange}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{level}</span>
                      </label>
                    ))}
                  </div>
                  {formik.touched.level && formik.errors.level && (
                    <p className="mt-1 text-sm text-red-600">
                      Warning: {formik.errors.level}
                    </p>
                  )}
                </div>

                {/* Auto-Calculated Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Duration
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-lg font-bold text-blue-900">
                          {formatDuration(courseDuration)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Auto-calculated from all chapter videos
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thumbnail
                  </label>
                  {existingThumbnailUrl && (
                    <img
                      src={existingThumbnailUrl}
                      alt="Current thumbnail"
                      className="w-full h-48 object-cover rounded-xl shadow-md mb-3"
                    />
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {thumbnailError && (
                    <p className="mt-1 text-sm text-red-600">
                      Warning: {thumbnailError}
                    </p>
                  )}
                </div>

                {/* Demo Video */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Demo Video
                  </label>
                  {existingDemoVideoUrl && (
                    <video
                      src={existingDemoVideoUrl}
                      controls
                      className="w-full h-48 rounded-xl shadow-md mb-3 object-cover"
                    />
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {videoError && (
                    <p className="mt-1 text-sm text-red-600">
                      Warning: {videoError}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => navigate("/instructor/courses")}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:scale-[1.02] ${
                    submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    </div>
                  ) : (
                    "Update Course"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditPage;