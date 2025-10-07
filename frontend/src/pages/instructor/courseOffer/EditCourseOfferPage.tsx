import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { getInstructorCourseOfferById, editInstructorCourseOffer } from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import type { ICourseOfferDetails } from "../interface/instructorInterface";

const formatDate = (date?: string | Date): string => {
  if (!date) return "";
  if (typeof date === "string") {
    const [day, month, year] = date.split("-");
    if (day && month && year) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return new Date(date).toISOString().split("T")[0];
  }
  return date.toISOString().split("T")[0];
};

const parseDate = (date: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const validationSchema = Yup.object({
  discount: Yup.number()
    .min(0, "Discount must be at least 0")
    .max(100, "Discount cannot exceed 100")
    .required("Discount percentage required"),
  startDate: Yup.string().required("Start date required"),
  endDate: Yup.string()
    .required("End date required")
    .test("is-after-start", "End date must be after start date", function (value) {
      return parseDate(value) > parseDate(this.parent.startDate);
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
        parseDate(values.startDate),
        parseDate(values.endDate)
      );
      toast.success("Course offer updated successfully");
      navigate("/instructor/courseOffers");
    } catch (err: any) {
      toast.error(err.message || "Failed to update offer");
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
          discount: offer.discount,
          startDate: formatDate(offer.startDate),
          endDate: formatDate(offer.endDate),
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-800">Course</label>
              <input
                type="text"
                disabled
                value={offer.courseName || "N/A"}
                className="w-full px-3 py-2 rounded bg-gray-100 text-black"
              />
            </div>

            <InputField
              name="discount"
              type="number"
              label="Discount Percentage"
              placeholder="Enter discount percentage"
            />
            <InputField name="startDate" type="date" label="Start Date" placeholder="Select start date" />
            <InputField name="endDate" type="date" label="End Date" placeholder="Select end date" />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => navigate("/instructor/courseOffers")}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600"
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