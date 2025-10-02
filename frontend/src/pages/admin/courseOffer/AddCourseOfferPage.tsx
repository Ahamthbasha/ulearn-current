import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { getPublishedCourses, createCourseOffer } from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";
import type { ICourseAdmin } from "../../../types/interfaces/IAdminInterface";

const validationSchema = Yup.object({
  courseId: Yup.string().required("Course is required"),
  discountPercentage: Yup.number()
    .required("Discount percentage is required")
    .min(0, "Discount must be at least 0")
    .max(100, "Discount cannot exceed 100"),
  startDate: Yup.string()
    .required("Start date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .test("is-future", "Start date cannot be in the past", (value) => {
      if (!value) return false;
      return new Date(value) >= new Date(new Date().setHours(0, 0, 0, 0));
    }),
  endDate: Yup.string()
    .required("End date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .test("is-after-start", "End date must be after start date", function (value) {
      if (!value || !this.parent.startDate) return false;
      return new Date(value) > new Date(this.parent.startDate);
    }),
});

const AddCourseOfferPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ICourseAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await getPublishedCourses();
        console.log("Fetched courses response:", response); // Debug raw response
        if (!Array.isArray(response.data)) {
          console.error("Unexpected response data format:", response.data);
          throw new Error("Invalid response format from getPublishedCourses");
        }
        const typedData: ICourseAdmin[] = response.data.map((item: any) => {
          if (!item.courseId) {
            console.error("Missing courseId in item:", item);
            throw new Error("Course data missing courseId");
          }
          return {
            courseId: item.courseId, // Use courseId from the response
            courseName: item.courseName || "Unnamed Course",
            isListed: item.isListed || false,
            isVerified: item.isVerified || false,
          };
        });
        console.log("Mapped courses:", typedData); // Debug mapped data
        setCourses(typedData);
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleSubmit = async (
    values: { courseId: string; discountPercentage: number; startDate: string; endDate: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    console.log("Form values:", values); // Debug values being sent
    try {
      await createCourseOffer(
        values.courseId,
        values.discountPercentage,
        new Date(values.startDate),
        new Date(values.endDate)
      );
      toast.success("Course offer created successfully");
      navigate("/admin/courseOffers");
    } catch (err) {
      console.error("Error creating offer:", err);
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading courses...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error} <button onClick={() => window.location.reload()} className="ml-2 text-blue-500">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Add Course Offer</h1>
      <Formik
        initialValues={{
          courseId: "",
          discountPercentage: 0,
          startDate: "",
          endDate: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label
                htmlFor="courseId"
                className="block text-gray-800 text-sm font-semibold mb-1"
              >
                COURSE
              </label>
              <Field
                as="select"
                name="courseId"
                className="w-full px-3 py-2 rounded-lg border-2 border-transparent text-black text-sm focus:outline-none focus:border-2 bg-gray-100"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.courseId} value={course.courseId}>
                    {course.courseName}
                  </option>
                ))}
              </Field>
              <ErrorMessage
                name="courseId"
                component="span"
                className="text-sm text-red-500 mt-1"
              />
            </div>
            <InputField
              type="number"
              name="discountPercentage"
              label="Discount Percentage"
              placeholder="Enter discount percentage"
            />
            <InputField
              type="date"
              name="startDate"
              label="Start Date"
              placeholder="Select start date"
            />
            <InputField
              type="date"
              name="endDate"
              label="End Date"
              placeholder="Select end date"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => navigate("/admin/course-offers")}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
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

export default AddCourseOfferPage