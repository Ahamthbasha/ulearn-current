import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { getCourseOfferById, editCourseOffer } from "../../../api/action/AdminActionApi";
import { type ICourseOffer } from "../../../types/interfaces/IAdminInterface";
import { toast } from "react-toastify";

const formatDateToInput = (date: Date | string | undefined): string => {
  try {
    if (!date) throw new Error("Date is undefined");
    const formattedDate = new Date(date).toISOString().split("T")[0];
    if (isNaN(new Date(formattedDate).getTime())) throw new Error("Invalid date");
    return formattedDate;
  } catch (error) {
    console.error("Error formatting date:", error, "Input date:", date);
    return ""; // Return empty string on error, but log for debugging
  }
};

const validationSchema = Yup.object({
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

const EditCourseOfferPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<ICourseOffer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!offerId) {
        setError("No offer ID provided");
        toast.error("No offer ID provided");
        setLoading(false);
        return;
      }
      try {
        const response = await getCourseOfferById(offerId);
        console.log("Fetched offer data:", response);
        setOffer(response);
      } catch (err: any) {
        console.error("Error fetching offer:", err);
        const errorMessage = err.message || "Failed to fetch course offer";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [offerId]);

  const handleSubmit = async (
    values: { discountPercentage: number; startDate: string; endDate: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    if (!offerId) {
      toast.error("No offer ID provided");
      setSubmitting(false);
      return;
    }
    try {
      await editCourseOffer(
        offerId,
        values.discountPercentage,
        new Date(values.startDate),
        new Date(values.endDate)
      );
      toast.success("Course offer updated successfully");
      navigate("/admin/courseOffers");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update course offer";
      console.error("Error updating offer:", err);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading offer...</div>;
  }

  if (error || !offer) {
    return (
      <div className="p-6 text-center text-red-500">
        {error || "Course offer not found"}{" "}
        <button
          onClick={() => window.location.reload()}
          className="ml-2 text-blue-500 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render Formik only when offer is available
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Edit Course Offer</h1>
      <Formik
        initialValues={{
          discountPercentage: offer.discountPercentage || 0, // Fallback to 0 if undefined
          startDate: formatDateToInput(offer.startDate),
          endDate: formatDateToInput(offer.endDate),
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting}) => (
          <Form className="space-y-4">
            <div>
              <label className="block text-gray-800 text-sm font-semibold mb-1">
                Course
              </label>
              <input
                type="text"
                value={offer.courseId?.courseName || "Unknown Course"}
                disabled
                className="w-full px-3 py-2 rounded-lg border-2 border-transparent text-black text-sm bg-gray-100 opacity-50"
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
                onClick={() => navigate("/admin/courseOffers")}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Offer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditCourseOfferPage;