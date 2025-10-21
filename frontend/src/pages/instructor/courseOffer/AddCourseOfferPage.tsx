import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { getVerifiedCourses, createInstructorCourseOffer } from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import type { ICourses } from "../interface/instructorInterface";

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const validationSchema = Yup.object({
  courseId: Yup.string().required("Please select a course"),
  discountPercentage: Yup.number()
    .min(1, "Discount must be at least 1%")
    .max(100, "Discount cannot exceed 100%")
    .required("Discount percentage is required"),
  startDate: Yup.date()
    .min(getTodayDate(), "Start date cannot be in the past")
    .required("Start date is required"),
  endDate: Yup.date()
    .required("End date is required")
    .test("is-after-start", "End date must be after start date", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return false;
      return new Date(value) > new Date(startDate);
    })
    .test("is-future", "End date must be in the future", function (value) {
      if (!value) return false;
      const today = new Date(getTodayDate());
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      return new Date(value) > today;
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
        const response = await getVerifiedCourses();
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
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="courseId" className="block mb-1 font-semibold text-gray-800">
                Course
              </label>
              <Field
                as="select"
                name="courseId"
                className="w-full px-3 py-2 rounded border bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              placeholder="Enter discount percentage (0-100)"
              min={0}
              max={100}
            />
            <InputField
              name="startDate"
              type="date"
              label="Start Date"
              min={getTodayDate()}
              placeholder="Select start date"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newStartDate = e.target.value;
                if (newStartDate) {
                  const selectedDate = new Date(newStartDate);
                  const today = new Date(getTodayDate());
                  today.setHours(0, 0, 0, 0);
                  if (selectedDate < today) {
                    toast.error("Start date cannot be in the past. Please select today or a future date.");
                    setFieldValue("startDate", "");
                    setFieldValue("endDate", "");
                    return;
                  }
                }
                setFieldValue("startDate", newStartDate);
                if (newStartDate && values.endDate && new Date(values.endDate) <= new Date(newStartDate)) {
                  setFieldValue("endDate", "");
                  toast.info("End date has been reset as it was on or before the new start date.");
                }
              }}
            />
            <InputField
              name="endDate"
              type="date"
              label="End Date"
              min={
                values.startDate
                  ? new Date(new Date(values.startDate).getTime() + 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0]
                  : getTodayDate()
              }
              placeholder="Select end date"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => navigate("/instructor/courseOffers")}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-blue-300"
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