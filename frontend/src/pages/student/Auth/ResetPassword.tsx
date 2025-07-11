import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";

import PasswordField from "../../../components/common/PasswordField";
import { resetPassword } from "../../../api/auth/UserAuthentication";

const ResetPassword = () => {
  const navigate = useNavigate();

  const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/\d/, "Must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password is required"),
});

  const initialValues = {
    newPassword: "",
    confirmPassword: "",
  };

  const onSubmit = async (data: { newPassword: string; confirmPassword: string }) => {
    try {
      const response = await resetPassword(data.newPassword);
      if (response.success) {
        toast.success(response.message);
        localStorage.removeItem("ForgotPassEmail");
        navigate(`/user/login`);
      } else {
        toast.error(response.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-8 sm:p-10">
        
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-indigo-700">
            <span className="text-orange-500">U</span>learn
          </h1>
        </div>

        <h2 className="text-xl font-bold text-gray-800 text-center">Reset Your Password</h2>
        <p className="text-gray-600 text-sm text-center mt-1 mb-6">
          Enter a new password to regain access to your account.
        </p>

        <Formik
          initialValues={initialValues}
          validationSchema={resetPasswordSchema}
          onSubmit={onSubmit}
        >
          {() => (
            <Form className="space-y-5">
              <PasswordField name="newPassword" placeholder="New Password" />
              <PasswordField name="confirmPassword" placeholder="Confirm Password" />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition"
              >
                Confirm Reset
              </button>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <a
            href="/instructor/login"
            className="text-indigo-600 hover:underline text-sm"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
