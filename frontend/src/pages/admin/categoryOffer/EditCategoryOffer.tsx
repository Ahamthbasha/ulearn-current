import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import type { ICategoryOffer } from "../../../types/interfaces/IAdminInterface";
import { getCategoryOfferById, editCategoryOffer } from "../../../api/action/AdminActionApi";

const validationSchema = Yup.object({
  discountPercentage: Yup.number()
    .min(0, "Discount must be at least 0%")
    .max(100, "Discount cannot exceed 100%")
    .required("Discount percentage is required"),
  startDate: Yup.date().required("Start date is required").min(
    new Date(new Date().setHours(0, 0, 0, 0)),
    "Start date cannot be before today"
  ),
  endDate: Yup.date()
    .required("End date is required")
    .min(Yup.ref("startDate"), "End date must be after start date"),
});

const EditCategoryOfferPage: React.FC = () => {
  const { categoryOfferId } = useParams<{ categoryOfferId: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<ICategoryOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!categoryOfferId) {
        setError("Invalid category offer ID");
        setLoading(false);
        return;
      }
      try {
        const response = await getCategoryOfferById(categoryOfferId);
        setOffer(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [categoryOfferId]);

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-600 mb-4">Edit Category Offer</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        {loading || !offer ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading offer...</p>
          </div>
        ) : (
          <>
            {/* Read-only Category Display */}
            <div className="mb-6">
              <label className="block text-gray-800 text-sm font-semibold mb-1">
                CATEGORY
              </label>
              <div className="w-full px-3 py-2 rounded-lg font-medium border-2 border-gray-300 text-black text-sm bg-gray-100 cursor-not-allowed">
                {offer.categoryId.categoryName}
              </div>
              <p className="text-xs text-gray-500 mt-1">Category cannot be changed after creation.</p>
            </div>

            <Formik
              initialValues={{
                discountPercentage: offer.discountPercentage,
                startDate: new Date(offer.startDate).toISOString().split("T")[0],
                endDate: new Date(offer.endDate).toISOString().split("T")[0],
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitError(null);
                try {
                  await editCategoryOffer(
                    offer._id,
                    values.discountPercentage,
                    new Date(values.startDate),
                    new Date(values.endDate)
                  );
                  navigate("/admin/categoryOffers");
                } catch (err: any) {
                  setSubmitError(err.message);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
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
                  {submitError && (
                    <div className="text-sm font-semibold text-red-500">{submitError}</div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/admin/categoryOffers")}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-sm"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Updating..." : "Update Offer"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        )}
      </div>
    </div>
  );
};

export default EditCategoryOfferPage;