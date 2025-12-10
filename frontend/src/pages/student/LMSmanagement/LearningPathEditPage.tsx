import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, ErrorMessage, Field, type FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputField from "../../../components/common/InputField";
import CourseSelector from "../../../components/StudentComponents/CourseSelector";
import {
  getLearningPathById,
  updateLearningPath,
  getAllCategories,
} from "../../../api/action/StudentAction";

import type {
  UpdateLearningPathRequest,
  FormValues,
  CourseItem,
} from "../../../types/interfaces/IStudentInterface";
import type { ApiError } from "../../../types/interfaces/ICommon";

const isValidObjectId = (id: string): boolean =>
  /^[0-9a-fA-F]{24}$/.test(id);

const validationSchema = Yup.object({
  title: Yup.string()
    .required("Title is required")
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title cannot exceed 100 characters")
    .matches(
      /^[a-zA-Z0-9\s,.!?-]+$/,
      "Title can only contain letters, numbers, spaces, and basic punctuation"
    )
    .test(
      "min-letters",
      "Title must contain at least 10 letters",
      (v) => (v?.match(/[a-zA-Z]/g) || []).length >= 10
    ),

  description: Yup.string()
    .required("Description is required")
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters")
    .matches(
      /^[a-zA-Z0-9\s,.!?-]+$/,
      "Description can only contain letters, numbers, spaces, and basic punctuation"
    )
    .test(
      "min-letters",
      "Description must contain at least 10 letters",
      (v) => (v?.match(/[a-zA-Z]/g) || []).length >= 10
    ),

  category: Yup.string()
    .required("Category is required")
    .test("is-valid-objectid", "Invalid category ID format", (v) =>
      isValidObjectId(v || "")
    ),

  items: Yup.array()
    .of(
      Yup.object({
        courseId: Yup.string()
          .required("Course is required")
          .test("is-valid-objectid", "Invalid course ID format", (v) =>
            isValidObjectId(v || "")
          ),
        order: Yup.number().min(1).required().integer(),
      })
    )
    .min(1, "At least one course is required")
    .test(
      "unique-course-ids",
      "Duplicate courses are not allowed",
      (arr) => {
        if (!arr) return true;
        const ids = arr.map((i) => (i as CourseItem).courseId);
        return new Set(ids).size === ids.length;
      }
    ),

  thumbnail: Yup.mixed()
    .test("file-type", "Thumbnail must be an image (JPEG, PNG, or GIF)", (v: unknown) => {
      if (!v) return true;
      if (!(v instanceof File)) return false;
      return ["image/jpeg", "image/png", "image/gif"].includes(v.type);
    })
    .test("file-size", "Thumbnail must be less than 5MB", (v: unknown) => {
      if (!v || !(v instanceof File)) return true;
      return v.size <= 5 * 1024 * 1024;
    }),
});

const LearningPathEditPage: React.FC = () => {
  const { learningPathId } = useParams<{ learningPathId: string }>();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ _id: string; categoryName: string }>
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!learningPathId || !isValidObjectId(learningPathId)) {
        toast.error("Invalid learning path ID");
        navigate("/user/createdLms");
        return;
      }

      try {
        const [cats, lp] = await Promise.all([
          getAllCategories(),
          getLearningPathById(learningPathId),
        ]);

        setCategories(cats);

        const renumbered = (lp.items || []).map((it: any, i: number) => ({
          courseId: it.courseId,
          order: i + 1,
        }));

        setInitialValues({
          title: lp.title || "",
          description: lp.description || "",
          category: lp.category || "",
          items: renumbered,
          thumbnail: undefined,
        });

        setExistingThumbnail(lp.thumbnailUrl || null);
      } catch (e: unknown) {
        const err = e as ApiError;
        toast.error(
          err.response?.data?.message || err.message || "Failed to load data"
        );
        navigate("/user/createdLms");
      }
    };

    fetchData();
  }, [learningPathId, navigate]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, validateForm }: FormikHelpers<FormValues>
  ) => {
    const errors = await validateForm(values);
    if (Object.keys(errors).length) {
      setSubmitting(false);
      return;
    }

    try {
      const payload: UpdateLearningPathRequest = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        items: values.items.map((i) => ({
          courseId: i.courseId,
          order: i.order,
        })),
      };

      await updateLearningPath(learningPathId!, payload, values.thumbnail);
      toast.success("Learning path updated successfully!");
      navigate("/user/createdLms");
    } catch (e: unknown) {
        const err = e as ApiError;
        toast.error(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialValues) {
    return (
      <div className="container mx-auto p-4">
        <ToastContainer />
        <div className="flex justify-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Learning Path</h1>
      <ToastContainer />

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue, values, errors, touched }) => {
          // Reset items when category changes
          useEffect(() => {
            if (values.category && initialValues?.category !== values.category) {
              setFieldValue("items", []); // Clear all courses
            }
          }, [values.category, setFieldValue]);

          return (
            <Form className="space-y-4">
              <InputField name="title" label="Title" placeholder="Enter title..." />
              <InputField name="description" label="Description" placeholder="Enter description..." />

              <div>
                <label htmlFor="category" className="block font-medium mb-1">
                  Category
                </label>
                <Field
                  as="select"
                  name="category"
                  id="category"
                  className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.categoryName}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="category"
                  component="p"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <CourseSelector
                name="items"
                label="Courses"
                categoryId={values.category}
              />

              {errors.items && touched.items && (
                <div className="text-red-500 text-sm mt-1">
                  {typeof errors.items === "string" ? (
                    <p>{errors.items}</p>
                  ) : Array.isArray(errors.items) ? (
                    (errors.items as any[]).map((err, i) =>
                      err ? (
                        <p key={i}>
                          Course {i + 1}: {err.courseId || err.order || "Invalid"}
                        </p>
                      ) : null
                    )
                  ) : null}
                </div>
              )}

              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Image (Optional, max 5MB)
                </label>
                <input
                  id="thumbnail"
                  name="thumbnail"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    setFieldValue("thumbnail", file);
                    if (file) {
                      setThumbnailPreview(URL.createObjectURL(file));
                    } else {
                      setThumbnailPreview(null);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <ErrorMessage name="thumbnail" component="p" className="text-red-500 text-sm mt-1" />
                {(thumbnailPreview || existingThumbnail) && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Thumbnail Preview:</p>
                    <img
                      src={thumbnailPreview || existingThumbnail!}
                      alt="Preview"
                      className="max-w-xs h-auto rounded-lg border"
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
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/user/createdLms")}
                  className="bg-gray-200 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </

div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default LearningPathEditPage;