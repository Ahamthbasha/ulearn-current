import React, { useEffect, useState } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { sendVerification } from "../../../api/action/InstructorActionApi";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { type InstructorData, type VerificationFormValues } from "../interface/instructorInterface";

const InstructorVerificationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [instructorData, setInstructorData] = useState<InstructorData | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const emailFromQuery = queryParams.get("email") || "";

  useEffect(() => {
    const storedInstructor = localStorage.getItem("instructor");
    if (storedInstructor) {
      try {
        const parsedInstructor: InstructorData = JSON.parse(storedInstructor);
        console.log(parsedInstructor);
        setInstructorData(parsedInstructor);
      } catch (error) {
        console.error("Error parsing instructor data from localStorage:", error);
        toast.error("Unable to load user information. Please login again.");
      }
    } else {
      toast.error("No user information found. Please login again.");
    }
  }, []);

  const validationSchema = Yup.object({
    name: Yup.string()
      .matches(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters")
      .required("Name is required")
      .trim(),
    email: Yup.string()
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Enter a valid email format"
      )
      .trim()
      .lowercase()
      .required("Email is required"),
    degreeCertificate: Yup.mixed()
      .required("Degree Certificate is required")
      .test("fileType", "Only PDF, PNG, JPG, JPEG files are allowed", (value) => {
        if (!value) return false;
        const file = value as File;
        const validTypes = ["application/pdf", "image/png", "image/jpg", "image/jpeg"];
        return validTypes.includes(file.type);
      })
      .test("fileSize", "File size must be less than 5MB", (value) => {
        if (!value) return false;
        const file = value as File;
        return file.size <= 5 * 1024 * 1024; // 5MB
      }),
    resume: Yup.mixed()
      .required("Resume is required")
      .test("fileType", "Only PDF, DOC, DOCX files are allowed", (value) => {
        if (!value) return false;
        const file = value as File;
        const validTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        return validTypes.includes(file.type);
      })
      .test("fileSize", "File size must be less than 5MB", (value) => {
        if (!value) return false;
        const file = value as File;
        return file.size <= 5 * 1024 * 1024; // 5MB
      }),
  });

  const handleSubmit = async (values: VerificationFormValues) => {
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

  if (!instructorData) {
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-8 mt-8 bg-white rounded shadow text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-8 mt-8 bg-white rounded shadow">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
        {emailFromQuery
          ? "Re-Verify Instructor Profile"
          : "Instructor Verification"}
      </h2>

      <Formik<VerificationFormValues>
        initialValues={{
          name: instructorData.name,
          email: emailFromQuery || instructorData.email,
          degreeCertificate: null,
          resume: null,
        }}
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
              disabled={true}
            />

            <div className="mt-4">
              <InputField
                type="email"
                name="email"
                label="Email"
                placeholder="Enter your email"
                disabled={true}
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="degreeCertificate"
                className="text-xs sm:text-sm font-semibold block mb-1"
              >
                Degree Certificate <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="degreeCertificate"
                accept=".pdf,.png,.jpg,.jpeg"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  if (e.currentTarget.files?.[0]) {
                    setFieldValue(
                      "degreeCertificate",
                      e.currentTarget.files[0]
                    );
                  }
                }}
              />
              <ErrorMessage
                name="degreeCertificate"
                component="div"
                className="text-red-500 text-xs mt-1 font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, PNG, JPG, JPEG (Max 5MB)
              </p>
            </div>

            <div className="mt-4">
              <label
                htmlFor="resume"
                className="text-xs sm:text-sm font-semibold block mb-1"
              >
                Resume <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  if (e.currentTarget.files?.[0]) {
                    setFieldValue("resume", e.currentTarget.files[0]);
                  }
                }}
              />
              <ErrorMessage
                name="resume"
                component="div"
                className="text-red-500 text-xs mt-1 font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, DOC, DOCX (Max 5MB)
              </p>
            </div>

            <div className="mt-6 text-center">
              {isSubmitting ? (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 bg-gray-500 text-white font-semibold py-2 px-6 rounded opacity-70 cursor-not-allowed mx-auto"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition duration-200"
                >
                  Submit Verification
                </button>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By submitting this form, you agree to have your credentials reviewed 
                for instructor verification purposes.
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default InstructorVerificationForm;