import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputField from '../../../components/common/InputField';
import { getCouponById, editCoupon } from '../../../api/action/AdminActionApi';
import {type  adminCouponDto } from '../../../types/interfaces/IAdminInterface';

const validationSchema = Yup.object({
  code: Yup.string()
    .required('Coupon code is required')
    .matches(/^[A-Z0-9\s]{4,10}$/, 'Coupon code must be 4-10 uppercase letters, numbers, or spaces'),
  discount: Yup.number()
    .required('Discount is required')
    .min(5, 'Discount must be at least 5')
    .max(100, 'Discount cannot exceed 100'),
  expiryDate: Yup.string()
    .required('Expiry date is required')
    .test('is-future-date', 'Expiry date must be in the future', (value) => {
      if (!value) return false;
      const [day, month, year] = value.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      return date > new Date();
    }),
  minPurchase: Yup.number()
    .required('Minimum purchase is required')
    .moreThan(0, 'Minimum purchase must be greater than 0'),
  maxDiscount: Yup.number()
    .required('Maximum discount is required')
    .moreThan(0, 'Maximum discount must be greater than 0'),
});

const EditCouponPage: React.FC = () => {
  const { couponId } = useParams<{ couponId: string }>();
  const [initialValues, setInitialValues] = useState<adminCouponDto>({
    couponId: '',
    code: '',
    discount: 0,
    status: true,
    minPurchase: 0,
    maxDiscount: 0,
    expiryDate: '',
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Function to convert DD-MM-YYYY to YYYY-MM-DD for input field
  const convertToInputDateFormat = (date: string): string => {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  };

  // Function to convert YYYY-MM-DD to DD-MM-YYYY for submission
  const convertToApiDateFormat = (date: string): string => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const fetchCoupon = async () => {
      if (!couponId) {
        setFetchError('Invalid coupon ID');
        setLoading(false);
        return;
      }
      try {
        const response = await getCouponById(couponId);
        const coupon: adminCouponDto = response.data;
        setInitialValues({
          couponId: coupon.couponId,
          code: coupon.code,
          discount: coupon.discount,
          status: coupon.status,
          minPurchase: coupon.minPurchase,
          maxDiscount: coupon.maxDiscount,
          expiryDate: convertToInputDateFormat(coupon.expiryDate),
        });
        setLoading(false);
      } catch (err: unknown) {
  let message = 'Failed to fetch coupon';
  if (err instanceof Error) {
    message = err.message;
  }
  setFetchError(message);
  setLoading(false);
}
    };
    fetchCoupon();
  }, [couponId]);

const handleSubmit = async (
  values: adminCouponDto,
  { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
) => {
  setServerError(null);
  try {
    if (!couponId) throw new Error('Invalid coupon ID');
    const submissionValues = {
      ...values,
      expiryDate: convertToApiDateFormat(values.expiryDate),
    };
    await editCoupon(couponId, submissionValues);
    navigate('/admin/coupons');
  } catch (err: unknown) {
    let message = 'Failed to update coupon';
    if (err instanceof Error) {
      message = err.message;
    }
    setServerError(message);
    setSubmitting(false);
  }
};


  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex justify-center items-center min-h-[50vh]">
        <div className="bg-red-100 text-red-700 rounded-lg p-4 text-sm">
          {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-600 mb-4">Edit Coupon</h1>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
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
                  Update
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default EditCouponPage;