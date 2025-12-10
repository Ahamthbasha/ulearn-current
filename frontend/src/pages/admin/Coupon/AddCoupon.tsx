import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, type FormikHelpers } from 'formik';
import * as Yup from 'yup';
import InputField from '../../../components/common/InputField';
import { createCoupon } from '../../../api/action/AdminActionApi';
import { type CouponData } from '../../../types/interfaces/IAdminInterface';
import { isApiError } from '../interface/adminInterface';

const validationSchema = Yup.object({
  code: Yup.string()
    .required('Coupon code is required')
    .matches(/^[A-Z0-9\s]{4,10}$/, 'Coupon code must be 4-10 uppercase letters, numbers, or spaces'),
  discount: Yup.number()
    .required('Discount is required')
    .positive('Discount must be a positive number')
    .min(5, 'Discount must be at least 5')
    .max(100, 'Discount cannot exceed 100'),
  expiryDate: Yup.date()
    .required('Expiry date is required')
    .test('is-future', 'Expiry date must be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(value) >= today;
    }),
  minPurchase: Yup.number()
    .required('Minimum purchase is required')
    .positive('Minimum purchase must be a positive number')
    .max(1000000, 'Minimum purchase cannot exceed 1,000,000'),
  maxDiscount: Yup.number()
    .required('Maximum discount is required')
    .positive('Maximum discount must be a positive number')
    .max(100000, 'Maximum discount cannot exceed 100,000'),
});

const AddCouponPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format for the min attribute
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const initialValues: CouponData = {
    code: '',
    discount: undefined as unknown as number,
    expiryDate: '',
    minPurchase: undefined as unknown as number,
    maxDiscount: undefined as unknown as number,
  };

  const handleSubmit = async (
    values: CouponData,
    { setSubmitting }: FormikHelpers<CouponData>
  ): Promise<void> => {
    setServerError(null);
    try {
      await createCoupon(values);
      navigate('/admin/coupons');
    } catch (err: unknown) {
      let errorMessage = 'Failed to create coupon';
      
      if (isApiError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setServerError(errorMessage);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-600 mb-4">Add Coupon</h1>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              {serverError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {serverError}
                </div>
              )}
              <InputField
                type="text"
                name="code"
                label="Coupon Code"
                placeholder="Enter coupon code"
              />
              <InputField
                type="number"
                name="discount"
                label="Discount (%)"
                placeholder="Enter discount percentage"
              />
              <InputField
                type="date"
                name="expiryDate"
                label="Expiry Date"
                placeholder="Select expiry date"
                min={getTodayDate()}
              />
              <InputField
                type="number"
                name="minPurchase"
                label="Minimum Purchase"
                placeholder="Enter minimum purchase amount"
              />
              <InputField
                type="number"
                name="maxDiscount"
                label="Maximum Discount"
                placeholder="Enter maximum discount amount"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/coupons')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  Create
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddCouponPage;