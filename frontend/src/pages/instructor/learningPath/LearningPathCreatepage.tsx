import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import CourseSelector from "../../../components/InstructorComponents/CourseSelector";
import { createLearningPath } from "../../../api/action/InstructorActionApi";
import type { CreateLearningPathRequest } from "../../../types/interfaces/IInstructorInterface";

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

const LearningPathCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const initialValues: CreateLearningPathRequest = {
    title: "",
    description: "",
    items: [{ courseId: "", order: 1 }],
  };

  const handleSubmit = async (values: CreateLearningPathRequest) => {
    try {
      const payload: CreateLearningPathRequest = {
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        items: values.items.map((item) => ({
          courseId: item.courseId,
          order: item.order,
        })),
      };
      await createLearningPath(payload);
      navigate("/instructor/learningPath");
    } catch (err: any) {
      setError(err.message || "Failed to create learning path");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Learning Path</h1>
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
                Create
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

export default LearningPathCreatePage;