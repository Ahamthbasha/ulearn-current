import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import CourseSelector from "../../../components/InstructorComponents/CourseSelector";
import { getLearningPathById, updateLearningPath } from "../../../api/action/InstructorActionApi";
import type { UpdateLearningPathRequest } from "../../../types/interfaces/IInstructorInterface";

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required").trim(),
  description: Yup.string().required("Description is required").trim(),
  items: Yup.array()
    .of(
      Yup.object({
        courseId: Yup.string()
          .required("Course is required")
          .test("is-valid-objectid", "Invalid course ID format", (value) => isValidObjectId(value || "")),
        order: Yup.number().min(1, "Order must be at least 1").required("Order is required"),
      })
    )
    .min(1, "At least one course is required"),
});

const LearningPathEditPage: React.FC = () => {
  const { learningPathId } = useParams<{ learningPathId: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<UpdateLearningPathRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningPath = async () => {
      if (!learningPathId) return;
      try {
        const learningPath = await getLearningPathById(learningPathId);
        setInitialValues({
          title: learningPath.title,
          description: learningPath.description,
          items: learningPath.items,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load learning path");
      }
    };
    fetchLearningPath();
  }, [learningPathId]);

  const handleSubmit = async (values: UpdateLearningPathRequest) => {
    if (!learningPathId) return;
    try {
      const payload: UpdateLearningPathRequest = {
        ...values,
        title: values.title?.trim(),
        description: values.description?.trim(),
        items: values.items?.map((item) => ({
          courseId: item.courseId,
          order: item.order,
        })),
      };
      await updateLearningPath(learningPathId, payload);
      navigate("/instructor/learningPath");
    } catch (err: any) {
      setError(err.message || "Failed to update learning path");
    }
  };

  if (!initialValues) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Learning Path</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <InputField name="title" label="Title" placeholder="Enter title" />
            <InputField
              name="description"
              label="Description"
              placeholder="Enter description"
            />
            <CourseSelector name="items" label="Courses" />
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => navigate("/instructor/learningPath")}
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

export default LearningPathEditPage;