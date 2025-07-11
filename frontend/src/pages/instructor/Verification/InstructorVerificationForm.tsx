import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { sendVerification } from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

const InstructorVerificationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email from query params (used during re-verification)
  const queryParams = new URLSearchParams(location.search);
  const emailFromQuery = queryParams.get("email") || "";

  const initialValues = {
    name: "",
    email: emailFromQuery,
    degreeCertificate: null,
    resume: null,
  };

  const validationSchema = Yup.object({
    name: Yup.string()
  .matches(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces")
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters")
  .required("Name is required")
  .trim(),
    email: Yup.string().matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Enter a valid email format").trim().lowercase().required("Email is required"),
    degreeCertificate: Yup.mixed().required("Degree Certificate is required"),
    resume: Yup.mixed().required("Resume is required"),
  });

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      if (values.degreeCertificate) {
        formData.append("degreeCertificate", values.degreeCertificate);
      }
      if (values.resume) {
        formData.append("resume", values.resume);
      }

      const response = await sendVerification(formData);

      if (response) {
        toast.success("Verification request submitted successfully");
        navigate(`/instructor/verificationStatus/${values.email}`);
      }
    } catch (error) {
      toast.error("Error submitting verification request");
      console.error(error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-8 mt-8 bg-white rounded shadow">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
        {emailFromQuery ? "Re-Verify Instructor Profile" : "Instructor Verification"}
      </h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, isSubmitting }) => (
          <Form>
            <InputField
              type="text"
              name="name"
              label="Name"
              placeholder="Enter your name"
            />

            <div className="mt-4">
              <InputField
                type="email"
                name="email"
                label="Email"
                placeholder="Enter your email"
                disabled={!!emailFromQuery} // Disable if it's re-verification
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="degreeCertificate"
                className="text-xs sm:text-sm font-semibold block mb-1"
              >
                Degree Certificate
              </label>
              <input
                type="file"
                name="degreeCertificate"
                accept=".pdf,.png,.jpg,.jpeg"
                className="text-sm"
                onChange={(e) => {
                  if (e.currentTarget.files?.[0]) {
                    setFieldValue("degreeCertificate", e.currentTarget.files[0]);
                  }
                }}
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="resume"
                className="text-xs sm:text-sm font-semibold block mb-1"
              >
                Resume
              </label>
              <input
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                className="text-sm"
                onChange={(e) => {
                  if (e.currentTarget.files?.[0]) {
                    setFieldValue("resume", e.currentTarget.files[0]);
                  }
                }}
              />
            </div>

            <div className="mt-6 text-center">
              {isSubmitting ? (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 bg-gray-500 text-white font-semibold py-2 px-6 rounded opacity-70 cursor-not-allowed"
                >
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  Submitting...
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded"
                >
                  Submit Verification
                </button>
              )}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default InstructorVerificationForm;
