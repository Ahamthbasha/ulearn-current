import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputField from '../../../components/common/InputField';
import { createCoupon } from '../../../api/action/AdminActionApi';
import { type CouponData } from '../../../types/interfaces/IAdminInterface';

const validationSchema = Yup.object({
  code: Yup.string()
    .required('Coupon code is required')
    .matches(/^[A-Z0-9\s]{4,10}$/, 'Coupon code must be 4-10 uppercase letters, numbers, or spaces'),
  discount: Yup.number()
    .required('Discount is required')
    .min(5, 'Discount must be at least 5')
    .max(100, 'Discount cannot exceed 100'),
  expiryDate: Yup.date()
    .required('Expiry date is required')
    .min(new Date(), 'Expiry date must be in the future'),
  minPurchase: Yup.number()
    .required('Minimum purchase is required')
    .min(0, 'Minimum purchase cannot be negative'),
  maxDiscount: Yup.number()
    .required('Maximum discount is required')
    .min(0, 'Maximum discount cannot be negative'),
});

const AddCouponPage: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const initialValues: CouponData = {
    code: '',
    discount: 0,
    expiryDate: '',
    minPurchase: 0,
    maxDiscount: 0,
  };

  const handleSubmit = async (values: CouponData, { setSubmitting }: any) => {
    setServerError(null);
    try {
      await createCoupon(values);
      navigate('/admin/coupons');
    } catch (err: any) {
      setServerError(err.message || 'Failed to create coupon');
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