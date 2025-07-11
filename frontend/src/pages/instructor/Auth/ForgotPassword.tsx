import { Formik, Form } from "formik";
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useNavigate, Link } from "react-router-dom";

import InputField from "../../../components/common/InputField";
import { instructorVerifyEmail } from "../../../api/auth/InstructorAuthentication";

const ForgotPassword = () => {
  const initialValues = {
    email: ""
  };

  const navigate = useNavigate();

  const onSubmit = async (data: { email: string }) => {
    try {
      const response = await instructorVerifyEmail(data.email);
      if (response?.success) {
        localStorage.setItem("ForgotPassEmail", response.data.email);
        toast.success(response.message);
        navigate(`/instructor/forgotPasswordOtp`);
      } else {
        toast.error(response?.message || "An error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Error during password reset request", error);
      toast.error("Something went wrong");
    }
  };

  const emailSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required")
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-100 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-8 border border-gray-200">
        {/* Simulated Ulearn Branding */}
        <div className="text-center mb-6">
          <div className="text-3xl font-extrabold text-blue-700 tracking-wide">
            <span className="text-orange-500">U</span>learn
          </div>
          <h2 className="text-xl font-semibold mt-2">Forgot Password</h2>
          <p className="text-sm text-gray-600">Enter your email to reset your password</p>
        </div>

        <Formik initialValues={initialValues} validationSchema={emailSchema} onSubmit={onSubmit}>
          {() => (
            <Form className="space-y-5">
              <InputField
                label="Email"
                type="email"
                name="email"
                placeholder="you@example.com"
              />

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition duration-200 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Continue
              </button>
            </Form>
          )}
        </Formik>

        <div className="text-center mt-6">
          <Link to="/instructor/login" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
