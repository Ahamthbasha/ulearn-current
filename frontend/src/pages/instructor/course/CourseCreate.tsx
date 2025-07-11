import { useEffect, useState } from "react";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { instructorCreateCourse, getInstructorCategories } from "../../../api/action/InstructorActionApi";
import InputField from "../../../components/common/InputField";

interface Category {
  _id: string;
  categoryName: string;
}

const MAX_VIDEO_SIZE_MB = 200;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

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
      .matches(/^[A-Za-z ]{6,}$/, "Minimum 6 letters. Only letters and spaces allowed")
      .test("not-only-spaces", "Course name cannot be just spaces", (value) =>
        Boolean(value && value.trim().replace(/\s/g, "").length >= 6)
      )
      .required("Course name is required"),

    description: Yup.string()
      .trim()
      .test("not-only-spaces", "Description must contain meaningful text", (value) =>
        Boolean(value && value.trim().replace(/\s/g, "").length >= 10)
      )
      .required("Description is required"),

    category: Yup.string().required("Category is required"),

    price: Yup.number()
      .typeError("Price must be a number")
      .positive("Price must be greater than zero")
      .required("Price is required"),

    duration: Yup.string()
      .matches(/^[1-9][0-9]*$/, "Duration must be a positive number")
      .required("Duration is required"),

    level: Yup.string()
      .oneOf(["Beginner", "Intermediate", "Advanced"], "Invalid level selection")
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
      } catch (err:any) {
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
    <FormikProvider value={formik}>
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-bold mb-4">Create New Course</h2>

        <InputField name="courseName" label="Course Name" />
        <InputField name="description" label="Description" />

        {/* Category Dropdown */}
        <div>
          <label htmlFor="category" className="block font-medium mb-1">Category</label>
          <select
            id="category"
            name="category"
            value={formik.values.category}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 border-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
            ))}
          </select>
          {formik.touched.category && formik.errors.category && (
            <p className="text-red-500 text-sm">{formik.errors.category}</p>
          )}
        </div>

        <InputField name="price" label="Price" type="number" />
        <InputField name="duration" label="Duration" type="text" />

        {/* Level Dropdown */}
        <div>
          <label htmlFor="level" className="block font-medium mb-1">Level</label>
          <select
            id="level"
            name="level"
            value={formik.values.level}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 border-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select Level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          {formik.touched.level && formik.errors.level && (
            <p className="text-red-500 text-sm">{formik.errors.level}</p>
          )}
        </div>

        {/* Thumbnail Upload */}
        <div>
          <label className="block font-medium mb-1">Thumbnail</label>
          {thumbnailPreview && (
            <div className="mb-2">
              <img
                src={thumbnailPreview}
                alt="Thumbnail Preview"
                className="w-40 h-40 object-contain border rounded-md shadow"
              />
            </div>
          )}
          <input type="file" name="thumbnail" accept="image/*" onChange={handleThumbnailChange} />
          {thumbnailError && <p className="text-red-500 text-sm">{thumbnailError}</p>}
        </div>

        {/* Demo Video Upload */}
        <div>
          <label className="block font-medium mb-1">Demo Video</label>
          {videoPreview && (
            <video src={videoPreview} controls className="w-full h-56 rounded mb-2" />
          )}
          <input type="file" name="demoVideo" accept="video/*" onChange={handleVideoChange} />
          {videoError && <p className="text-red-500 text-sm">{videoError}</p>}
        </div>

        {/* Submit Button with Spinner */}
        <button
          type="submit"
          disabled={submitting}
          className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg shadow text-white ${
            submitting ? "bg-amber-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Creating...
            </>
          ) : (
            "Create Course"
          )}
        </button>
      </form>
    </FormikProvider>
  );
};

export default CourseCreatePage;
