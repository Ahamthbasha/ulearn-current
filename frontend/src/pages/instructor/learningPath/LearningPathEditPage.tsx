import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import CourseSelector from "../../../components/InstructorComponents/CourseSelector";
import { getLearningPathById, updateLearningPath } from "../../../api/action/InstructorActionApi";
import type { UpdateLearningPathRequest, LearningPathDTO } from "../../../types/interfaces/IInstructorInterface";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  items: Yup.array()
    .of(
      Yup.object({
        courseId: Yup.string().required("Course is required"),
        order: Yup.number().min(1, "Order must be at least 1").required("Order is required"),
      })
    )
    .min(1, "At least one course is required"),
  publishDate: Yup.string().optional().nullable(),
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
        const response = await getLearningPathById(learningPathId);
        if (response.success && response.data) {
          const learningPath: LearningPathDTO = response.data;
          setInitialValues({
            title: learningPath.title,
            description: learningPath.description,
            items: learningPath.items,
            publishDate: learningPath.publishDate,
          });
        } else {
          setError("Invalid API response");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load learning path");
      }
    };
    fetchLearningPath();
  }, [learningPathId]);

  const handleSubmit = async (values: UpdateLearningPathRequest) => {
    if (!learningPathId) return;
    try {
      await updateLearningPath(learningPathId, values);
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
            <InputField
              name="publishDate"
              label="Publish Date (Optional)"
              type="datetime-local"
            />
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