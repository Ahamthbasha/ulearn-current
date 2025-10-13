import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { getInstructorCourseOfferById, editInstructorCourseOffer } from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import type { ICourseOfferDetails } from "../interface/instructorInterface";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// Helper function to convert DD-MM-YYYY to YYYY-MM-DD
const formatDateForInput = (date: string | Date): string => {
  if (!date) return "";
  if (typeof date === "string") {
    const [day, month, year] = date.split("-").map(Number);
    if (day && month && year) {
      return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
    return new Date(date).toISOString().split("T")[0];
  }
  return date.toISOString().split("T")[0];
};

// Validation schema with enhanced rules
const validationSchema = Yup.object({
  discount: Yup.number()
    .min(0, "Discount must be at least 0%")
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

const EditInstructorCourseOfferPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<ICourseOfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!offerId) {
      setError("No offer ID provided");
      setLoading(false);
      toast.error("No offer ID provided");
      return;
    }

    console.log("Fetching offer with ID:", offerId);

    const fetchOffer = async () => {
      try {
        const response = await getInstructorCourseOfferById(offerId);
        console.log("API Response:", response);

        // Handle different response structures
        if (response && "success" in response && response.success && response.data) {
          setOffer(response.data as ICourseOfferDetails);
        } else if (response && "courseOfferId" in response) {
          setOffer(response as ICourseOfferDetails);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (e: any) {
        console.error("Error fetching offer:", e);
        setError(e.message || "Failed to load offer");
        toast.error(e.message || "Failed to load offer");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId]);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      await editInstructorCourseOffer(
        offerId!,
        values.discount,
        new Date(values.startDate),
        new Date(values.endDate)
      );
      toast.success("Course offer updated successfully");
      navigate("/instructor/courseOffers");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to update offer";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading offer...</div>;
  if (error || !offer) return <div className="p-6 text-center text-red-500">{error || "Offer not found"}</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">Edit Course Offer</h1>
      <Formik
        initialValues={{
          discount: offer.discount || 0,
          startDate: formatDateForInput(offer.startDate),
          endDate: formatDateForInput(offer.endDate),
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-800">Course</label>
              <input
                type="text"
                disabled
                value={offer.courseName || "N/A"}
                className="w-full px-3 py-2 rounded bg-gray-100 text-black focus:outline-none"
              />
            </div>
            <InputField
              name="discount"
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
                {isSubmitting ? "Updating..." : "Update Offer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditInstructorCourseOfferPage;