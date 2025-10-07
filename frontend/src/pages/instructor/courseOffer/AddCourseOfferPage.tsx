import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { getPublishedCourses, createInstructorCourseOffer } from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import type { ICourses } from "../interface/instructorInterface";

const validationSchema = Yup.object({
  courseId: Yup.string().required("Course is required"),
  discountPercentage: Yup.number()
    .min(0, "Discount must be at least 0")
    .max(100, "Discount cannot exceed 100")
    .required("Discount percentage required"),
  startDate: Yup.string().required("Start date required"),
  endDate: Yup.string()
    .required("End date required")
    .test("is-after-start", "End date must be after start date", function (value) {
      return new Date(value) > new Date(this.parent.startDate);
    }),
});

const AddInstructorCourseOfferPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ICourses[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchCourses = async () => {
      try {
        const response = await getPublishedCourses();
        console.log("getPublishedCourses Response:", response);
        if (response && "success" in response && response.success && response.data) {
          setCourses(response.data as ICourses[]);
        } else if (Array.isArray(response)) {
          setCourses(response as ICourses[]);
        } else {
          throw new Error("Invalid response format for courses");
        }
      } catch (e: any) {
        console.error("Error fetching courses:", e);
        setError(e.message || "Failed to load courses");
        toast.error(e.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      console.log("Submitting offer with values:", values);
      await createInstructorCourseOffer(
        values.courseId,
        values.discountPercentage,
        new Date(values.startDate),
        new Date(values.endDate)
      );
      toast.success("Course offer created and submitted for approval");
      navigate("/instructor/courseOffers");
    } catch (err: any) {
      console.error("Error creating offer:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create offer";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading courses...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Add Course Offer</h1>
      <Formik
        initialValues={{ courseId: "", discountPercentage: 0, startDate: "", endDate: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="courseId" className="block mb-1 font-semibold text-gray-800">
                Course
              </label>
              <Field
                as="select"
                name="courseId"
                className="w-full px-3 py-2 rounded border bg-gray-100 text-black"
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.courseName} 
                  </option>
                ))}
              </Field>
              <ErrorMessage name="courseId" component="span" className="text-red-500 text-sm" />
            </div>
            <InputField
              name="discountPercentage"
              type="number"
              label="Discount Percentage"
              placeholder="Enter discount percentage"
            />
            <InputField
              name="startDate"
              type="date"
              label="Start Date"
              placeholder="Select start date"
            />
            <InputField name="endDate" type="date" label="End Date" placeholder="Select end date" />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => navigate("/instructor/courseOffers")}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                {isSubmitting ? "Creating..." : "Create Offer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddInstructorCourseOfferPage;