import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import InputField from '../../../components/common/InputField';
import { getCouponById, editCoupon } from '../../../api/action/AdminActionApi';
import { type adminCouponDto } from '../../../types/interfaces/IAdminInterface';

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
  const [originalExpiryDate, setOriginalExpiryDate] = useState<string>('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get the minimum date (either original date or today, whichever is earlier)
  const getMinDate = (originalDate: string): string => {
    if (!originalDate) return getTodayDate();
    
    const original = new Date(originalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    original.setHours(0, 0, 0, 0);
    
    // Return the earlier date between original and today
    return original < today ? originalDate : getTodayDate();
  };

  // Convert DD-MM-YYYY (from backend) to YYYY-MM-DD (for input field)
  const convertToInputDateFormat = (date: string): string => {
    // Backend sends DD-MM-YYYY, convert to YYYY-MM-DD for HTML input
    const [day, month, year] = date.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Parse backend error and return user-friendly message
  const parseBackendError = (error: unknown): string => {
    let message = 'Failed to update coupon. Please try again.';

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage.includes('Cast to date failed')) {
        return 'Invalid date format. Please select a valid expiry date.';
      }
      if (errorMessage.includes('validation failed')) {
        return 'Please check all fields and ensure they meet the requirements.';
      }
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        return 'This coupon code already exists. Please use a different code.';
      }
      if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to fetch')) {
        return 'Network error. Please check your connection and try again.';
      }
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        return 'Your session has expired. Please log in again.';
      }
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return 'Coupon not found. It may have been deleted.';
      }

      if (
        !errorMessage.includes('Cast to') &&
        !errorMessage.includes('path') &&
        !errorMessage.includes('stack') &&
        !errorMessage.includes('at async') &&
        errorMessage.length < 100
      ) {
        message = errorMessage;
      }
    }

    return message;
  };

  // Dynamic validation schema
  const getValidationSchema = (originalDate: string) => {
    return Yup.object({
      code: Yup.string()
        .required('Coupon code is required')
        .matches(/^[A-Z0-9\s]{4,10}$/, 'Coupon code must be 4-10 uppercase letters, numbers, or spaces'),
      discount: Yup.number()
        .required('Discount is required')
        .positive('Discount must be a positive number')
        .min(5, 'Discount must be at least 5')
        .max(100, 'Discount cannot exceed 100'),
      expiryDate: Yup.string()
        .required('Expiry date is required')
        .test('is-valid-date', 'Expiry date must be in the future', function(value) {
          if (!value) return false;
          
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          selectedDate.setHours(0, 0, 0, 0);
          
          // If the date hasn't changed from original, allow it (even if expired)
          if (value === originalDate) {
            return true;
          }
          
          // If changing the date, it must be in the future
          return selectedDate >= today;
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
        // Backend sends DD-MM-YYYY, convert to YYYY-MM-DD for input
        const convertedDate = convertToInputDateFormat(coupon.expiryDate);
        
        setOriginalExpiryDate(convertedDate);
        setInitialValues({
          couponId: coupon.couponId,
          code: coupon.code,
          discount: coupon.discount,
          status: coupon.status,
          minPurchase: coupon.minPurchase,
          maxDiscount: coupon.maxDiscount,
          expiryDate: convertedDate,
        });
        setLoading(false);
      } catch (err: unknown) {
        const message = parseBackendError(err);
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
      
      // Send date as-is (YYYY-MM-DD) - backend now accepts this format
      await editCoupon(couponId, values);
      navigate('/admin/coupons');
    } catch (err: unknown) {
      const message = parseBackendError(err);
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
          validationSchema={getValidationSchema(originalExpiryDate)}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              {serverError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                  <div className="flex items-start">
                    <svg 
                      className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <span>{serverError}</span>
                  </div>
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
                min={getMinDate(originalExpiryDate)}
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
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
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