import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage, Field, type FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "../../../components/common/InputField";
import CourseSelector from "../../../components/StudentComponents/CourseSelector";
import { createLearningPath, getAllCategories } from "../../../api/action/StudentAction";
import type { CreateLearningPathRequest } from "../../../types/interfaces/IStudentInterface";

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const validationSchema = Yup.object({
  title: Yup.string()
    .required("Title is required")
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title cannot exceed 100 characters")
    .matches(/^[a-zA-Z0-9\s,.!?-]+$/, "Title can only contain letters, numbers, spaces, and basic punctuation")
    .test(
      "min-letters",
      "Title must contain at least 10 letters",
      (value) => {
        if (!value) return false;
        const letterCount = (value.match(/[a-zA-Z]/g) || []).length;
        return letterCount >= 10;
      }
    ),
  description: Yup.string()
    .required("Description is required")
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters")
    .matches(/^[a-zA-Z0-9\s,.!?-]+$/, "Description can only contain letters, numbers, spaces, and basic punctuation")
    .test(
      "min-letters",
      "Description must contain at least 10 letters",
      (value) => {
        if (!value) return false;
        const letterCount = (value.match(/[a-zA-Z]/g) || []).length;
        return letterCount >= 10;
      }
    ),
  category: Yup.string()
    .required("Category is required")
    .test("is-valid-objectid", "Invalid category ID format", (value) => isValidObjectId(value || "")),
  items: Yup.array()
    .of(
      Yup.object({
        courseId: Yup.string()
          .required("Course is required")
          .test("is-valid-objectid", "Invalid course ID format", (value) => isValidObjectId(value || "")),
        order: Yup.number()
          .min(1, "Order must be at least 1")
          .required("Order is required")
          .integer("Order must be an integer"),
      })
    )
    .min(1, "At least one course is required")
    .test(
      "unique-course-ids",
      "Duplicate courses are not allowed",
      (items) => {
        if (!items) return true;
        const courseIds = items.map((item: any) => item.courseId);
        const uniqueCourseIds = new Set(courseIds);
        return uniqueCourseIds.size === courseIds.length;
      }
    )
    .test(
      "unique-orders",
      "Duplicate order numbers are not allowed",
      (items) => {
        if (!items) return true;
        const orders = items.map((item: any) => item.order);
        const uniqueOrders = new Set(orders);
        return uniqueOrders.size === orders.length;
      }
    ),
  thumbnail: Yup.mixed()
    .required("Thumbnail image is required")
    .test(
      "file-type",
      "Thumbnail must be an image (JPEG, PNG, or GIF)",
      (value: unknown) => {
        if (!value) return false;
        if (!(value instanceof File)) return false;
        return ["image/jpeg", "image/png", "image/gif"].includes(value.type);
      }
    )
    .test(
      "file-size",
      "Thumbnail must be less than 5MB",
      (value: unknown) => {
        if (!value || !(value instanceof File)) return false;
        return value.size <= 5 * 1024 * 1024; // 5MB
      }
    ),
});

const LearningPathCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ _id: string; categoryName: string }>>([]);

  const initialValues: CreateLearningPathRequest & { thumbnail?: File } = {
    title: "",
    description: "",
    category: "",
    items: [{ courseId: "", order: 1 }],
    thumbnail: undefined,
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        console.log("Fetched categories:", data);
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories", error);
        toast.error("Failed to load categories", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const handleSubmit = async (
    values: CreateLearningPathRequest & { thumbnail?: File },
    { setSubmitting, setFieldError }: FormikHelpers<CreateLearningPathRequest & { thumbnail?: File }>
  ) => {
    try {
      if (!values.items || values.items.length === 0 || values.items.some(item => !item.courseId || !isValidObjectId(item.courseId))) {
        setFieldError("items", "At least one valid course is required");
        toast.error("Please select at least one valid course", {
          position: "top-right",
          autoClose: 5000,
        });
        setSubmitting(false);
        return;
      }

      if (!values.category || !isValidObjectId(values.category)) {
        setFieldError("category", "Please select a valid category");
        toast.error("Please select a valid category", {
          position: "top-right",
          autoClose: 5000,
        });
        setSubmitting(false);
        return;
      }

      const payload: CreateLearningPathRequest = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        items: values.items.map((item) => ({
          courseId: item.courseId,
          order: item.order,
        })),
      };

      console.log("Frontend payload:", payload);
      console.log("Frontend thumbnail:", values.thumbnail);
      await createLearningPath(payload, values.thumbnail);
      toast.success("Learning path created successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate("/user/createdLms");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to create learning path";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
      console.error("Create learning path error:", err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Learning Path</h1>
      <ToastContainer />
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ isSubmitting, setFieldValue, values, errors, touched }) => (
          <Form className="space-y-4">
            <InputField
              name="title"
              label="Title"
              placeholder="Enter title (5-100 characters, at least 10 letters)"
            />
            <InputField
              name="description"
              label="Description"
              placeholder="Enter description (10-500 characters, at least 10 letters)"
            />

            <div>
              <label htmlFor="category" className="block font-medium mb-1">
                Category
              </label>
              <Field
                as="select"
                name="category"
                id="category"
                className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const selectedCategory = e.target.value;
                  setFieldValue("category", selectedCategory);
                  console.log("Category selected:", selectedCategory, "Form state category:", values.category);
                }}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.categoryName}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="category" component="p" className="text-red-500 text-sm mt-1" />
            </div>

            <CourseSelector name="items" label="Courses" categoryId={values.category} /> {/* Pass the selected category */}
            {errors.items && touched.items && (
              <div className="text-red-500 text-sm mt-1">
                {typeof errors.items === "string" ? (
                  <p>{errors.items}</p>
                ) : (
                  errors.items.map((itemError, index) => (
                    <p key={index}>
                      Course {index + 1}:{" "}
                      {(itemError as { courseId?: string; order?: string }).courseId ||
                        (itemError as { courseId?: string; order?: string }).order ||
                        "Invalid course or order"}
                    </p>
                  ))
                )}
              </div>
            )}

            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Image (Required, max 5MB)
              </label>
              <input
                id="thumbnail"
                name="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setFieldValue("thumbnail", file);
                  if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    setThumbnailPreview(previewUrl);
                  } else {
                    setThumbnailPreview(null);
                  }
                  console.log("Selected thumbnail:", file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <ErrorMessage name="thumbnail" component="p" className="text-red-500 text-sm mt-1" />
              {thumbnailPreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Thumbnail Preview:</p>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="max-w-xs h-auto rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue("thumbnail", undefined);
                      setThumbnailPreview(null);
                    }}
                    className="mt-2 text-sm text-red-500 hover:text-red-700"
                  >
                    Remove Thumbnail
                  </button>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/user/createdLms")}
                className="bg-gray-200 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default LearningPathCreatePage;