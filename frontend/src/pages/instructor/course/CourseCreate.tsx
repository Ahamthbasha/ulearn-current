import { useEffect, useState } from "react";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  instructorCreateCourse,
  getInstructorCategories,
} from "../../../api/action/InstructorActionApi";
import InputField from "../../../components/common/InputField";
import { type Category } from "../interface/instructorInterface";

const MAX_VIDEO_SIZE_MB = 200;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const CourseCreatePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState("");
  const [videoError, setVideoError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getInstructorCategories();
        setCategories(res);
      } catch (error) {
        toast.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  const validationSchema = Yup.object({
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
          return stripped.length >= 5;
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
      .oneOf(
        ["Beginner", "Intermediate", "Advanced"],
        "Invalid level selection"
      )
      .required("Level is required"),
  });

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
    validationSchema,
    onSubmit: async (values) => {
      if (!values.thumbnail || !values.demoVideo) {
        toast.error("Thumbnail and demo video are required");
        return;
      }

      setSubmitting(true);

      const formData = new FormData();
      formData.append("courseName", values.courseName);
      formData.append("description", values.description);
      formData.append("category", values.category);
      formData.append("price", values.price.toString());
      formData.append("duration", values.duration);
      formData.append("level", values.level);
      formData.append("thumbnail", values.thumbnail);
      formData.append("demoVideos", values.demoVideo);

      try {
        const res = await instructorCreateCourse(formData);
        toast.success(res.data.message);
        navigate("/instructor/courses");
      } catch (err: any) {
        toast.error(err?.response?.data?.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setThumbnailError("");
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setThumbnailError("Only JPG, PNG, or WebP image formats are allowed");
        e.currentTarget.value = "";
        return;
      }
      formik.setFieldValue("thumbnail", file);

      const reader = new FileReader();
      reader.onload = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setVideoError("");
    if (file) {
      if (!file.type.startsWith("video/")) {
        setVideoError("Only valid video files are allowed");
        e.currentTarget.value = "";
        return;
      }

      const maxSize = MAX_VIDEO_SIZE_MB * 1024 * 1024;
      if (file.size > maxSize) {
        setVideoError(`Video size must be under ${MAX_VIDEO_SIZE_MB}MB`);
        e.currentTarget.value = "";
        return;
      }

      formik.setFieldValue("demoVideo", file);

      const reader = new FileReader();
      reader.onload = () => setVideoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Create New Course
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Design and publish your next course to inspire learners worldwide
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-amber-600">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">📚</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {/* Course Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <span className="mr-3">📖</span>
                  Course Information
                </h2>
              </div>
              
              <div className="p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <InputField 
                      name="courseName" 
                      label="Course Name"
                 
                    />
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                        Course Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-all duration-200 resize-none"
                        placeholder="Provide a compelling description of your course..."
                      />
                      {formik.touched.description && formik.errors.description && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {formik.errors.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          id="category"
                          name="category"
                          value={formik.values.category}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="" disabled>
                            Select a category for your course
                          </option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.categoryName}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {formik.touched.category && formik.errors.category && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {formik.errors.category}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
                          Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                          <input
                            id="price"
                            name="price"
                            type="number"
                            value={formik.values.price}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-all duration-200"
                            placeholder="0.00"
                          />
                        </div>
                        {formik.touched.price && formik.errors.price && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <span className="mr-1">⚠️</span>
                            {formik.errors.price}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2">
                          Duration (Hours)
                        </label>
                        <div className="relative">
                          <input
                            id="duration"
                            name="duration"
                            type="text"
                            value={formik.values.duration}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-all duration-200"
                            placeholder="e.g., 10"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">hrs</span>
                        </div>
                        {formik.touched.duration && formik.errors.duration && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <span className="mr-1">⚠️</span>
                            {formik.errors.duration}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="level" className="block text-sm font-semibold text-gray-700 mb-2">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {["Beginner", "Intermediate", "Advanced"].map((level) => (
                          <label
                            key={level}
                            className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              formik.values.level === level
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-25"
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
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {formik.errors.level}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Media Upload Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <span className="mr-3">🎬</span>
                  Course Media
                </h2>
              </div>
              
              <div className="p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Thumbnail Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">🖼️</span>
                      Course Thumbnail
                    </h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-amber-400 transition-colors duration-200">
                      {thumbnailPreview ? (
                        <div className="space-y-4">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail Preview"
                            className="w-full h-48 object-cover rounded-lg shadow-md"
                          />
                          <div className="flex justify-center">
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200">
                              <span className="mr-2">🔄</span>
                              Change Image
                              <input
                                type="file"
                                name="thumbnail"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer block text-center">
                          <div className="mb-4">
                            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-lg font-medium text-gray-700 mb-1">Upload Thumbnail</p>
                          <p className="text-sm text-gray-500">JPG, PNG, or WebP (Max 10MB)</p>
                          <input
                            type="file"
                            name="thumbnail"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {thumbnailError && (
                      <p className="text-red-600 text-sm flex items-center">
                        <span className="mr-1">⚠️</span>
                        {thumbnailError}
                      </p>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="mr-2">🎥</span>
                      Demo Video
                    </h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-400 transition-colors duration-200">
                      {videoPreview ? (
                        <div className="space-y-4">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full h-48 rounded-lg shadow-md object-cover"
                          />
                          <div className="flex justify-center">
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200">
                              <span className="mr-2">🔄</span>
                              Change Video
                              <input
                                type="file"
                                name="demoVideo"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer block text-center">
                          <div className="mb-4">
                            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-lg font-medium text-gray-700 mb-1">Upload Demo Video</p>
                          <p className="text-sm text-gray-500">MP4, AVI, MOV (Max {MAX_VIDEO_SIZE_MB}MB)</p>
                          <input
                            type="file"
                            name="demoVideo"
                            accept="video/*"
                            onChange={handleVideoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {videoError && (
                      <p className="text-red-600 text-sm flex items-center">
                        <span className="mr-1">⚠️</span>
                        {videoError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate("/instructor/courses")}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                  submitting
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed transform-none"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
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
                    Creating Course...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🚀</span>
                    Create Course
                  </div>
                )}
              </button>
            </div>
          </form>
        </FormikProvider>
      </div>
    </div>
  );
};

export default CourseCreatePage;