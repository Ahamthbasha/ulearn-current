import { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import Card from "../../../components/common/Card";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";

import {
  instructorGetProfile,
  instructorUpdatePassword,
  instructorUpdateBankDetail,
} from "../../../api/action/InstructorActionApi";
import { setInstructor } from "../../../redux/slices/instructorSlice";

const InstructorProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await instructorGetProfile();
        console.log("response from profilepage instructor", response);
        if (response.success) {
          dispatch(
            setInstructor({
              userId: response.data._id || null,
              name: response.data.instructorName,
              email: response.data.email,
              role: response.data.role || null,
              isBlocked: response.data.isBlocked || null,
              isVerified: response.data.status,
              profilePicture: response.data.profilePicUrl || null,
            })
          );
          setProfile(response.data);
        }
      } catch (error) {
        console.error("Failed to load instructor profile", error);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 flex flex-col items-center">
      <Card
        title="🧑‍🏫 Instructor Profile"
        className="max-w-xl w-full"
        footer={
          <div className="flex flex-col gap-2 justify-center items-center">
            <button
              onClick={() => (window.location.href = "/instructor/editProfile")}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-blue-600 text-sm underline"
            >
              {showPasswordForm ? "Cancel Password Change" : "Change Password"}
            </button>
            <button
              onClick={() => setShowBankForm(!showBankForm)}
              className="text-blue-600 text-sm underline"
            >
              {showBankForm ? "Cancel Bank Details Update" : "Update Bank Details"}
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center mb-4">
          {profile.profilePicUrl ? (
            <img
              src={profile.profilePicUrl}
              alt="Instructor Profile"
              className="w-28 h-28 rounded-full object-cover mb-2 shadow"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mb-2">
              No Image
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm sm:text-base">
  <p>
    <strong>Username:</strong> {profile.instructorName}
  </p>
  <p>
    <strong>Email:</strong> {profile.email}
  </p>

  <div>
    <strong>Skills:</strong>
    {profile.skills && profile.skills.length > 0 ? (
      <select className="ml-2 border rounded px-2 py-1 text-sm bg-gray-50">
        {profile.skills.map((skill: string, idx: number) => (
          <option key={idx}>{skill}</option>
        ))}
      </select>
    ) : (
      <span className="ml-2 text-gray-500">None</span>
    )}
  </div>

  <div>
    <strong>Expertise:</strong>
    {profile.expertise && profile.expertise.length > 0 ? (
      <select className="ml-2 border rounded px-2 py-1 text-sm bg-gray-50">
        {profile.expertise.map((exp: string, idx: number) => (
          <option key={idx}>{exp}</option>
        ))}
      </select>
    ) : (
      <span className="ml-2 text-gray-500">None</span>
    )}
  </div>

  <p>
    <strong>Status:</strong> {profile.status ? "✅ Verified" : "⏳ Not Verified"}
  </p>
  <p>
    <strong>Mentor:</strong> {profile.mentor ? "Yes" : "No"}
  </p>
  <p>
    <strong>Bank Status:</strong>{" "}
    {profile.bankAccountLinked ? "Linked" : "Not Linked"}
  </p>
</div>

      </Card>

      {showPasswordForm && (
        <div className="w-full max-w-xl mt-6 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">🔒 Change Password</h2>
          <Formik
            initialValues={{
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            }}
            validationSchema={Yup.object({
              currentPassword: Yup.string().required("Current password is required"),
              newPassword: Yup.string()
                .required("New password is required")
                .min(6, "Password must be at least 6 characters")
                .matches(/[A-Z]/, "Must contain at least one uppercase letter")
                .matches(/[a-z]/, "Must contain at least one lowercase letter")
                .matches(/[0-9]/, "Must contain at least one number")
                .matches(
                  /[!@#$%^&*(),.?":{}|<>]/,
                  "Must contain at least one special character"
                ),
              confirmPassword: Yup.string()
                .oneOf([Yup.ref("newPassword")], "Passwords must match")
                .required("Confirm your new password"),
            })}
            onSubmit={async (values, { resetForm }) => {
              try {
                const response = await instructorUpdatePassword({
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                });

                if (response.success) {
                  toast.success("Password updated successfully");
                  resetForm();
                  setShowPasswordForm(false);
                } else {
                  toast.error(response.message || "Password update failed");
                }
              } catch (error:any) {
                toast.error(error?.response?.data?.message);
              }
            }}
          >
            <Form className="space-y-4">
              <InputField
                name="currentPassword"
                type="password"
                label="Current Password"
                placeholder="Enter current password"
              />
              <InputField
                name="newPassword"
                type="password"
                label="New Password"
                placeholder="Enter new password"
              />
              <InputField
                name="confirmPassword"
                type="password"
                label="Confirm New Password"
                placeholder="Confirm new password"
              />
              <div className="text-right">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Update Password
                </button>
              </div>
            </Form>
          </Formik>
        </div>
      )}

      {showBankForm && (
        <div className="w-full max-w-xl mt-6 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">🏦 Update Bank Details</h2>
          <Formik
            initialValues={{
              accountHolderName: "",
              accountNumber: "",
              ifscCode: "",
              bankName: "",
            }}
            validationSchema={Yup.object({
              accountHolderName: Yup.string()
                .required("Account holder name is required")
                .matches(/^[a-zA-Z\s]+$/, "Only letters and spaces are allowed"),
              accountNumber: Yup.string()
                .required("Account number is required")
                .matches(/^\d{9,18}$/, "Account number must be 9-18 digits"),
              ifscCode: Yup.string()
                .required("IFSC code is required")
                .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
              bankName: Yup.string()
                .required("Bank name is required")
                .matches(/^[a-zA-Z\s]+$/, "Only letters and spaces are allowed"),
            })}
            onSubmit={async (values, { resetForm }) => {
              try {
                const res = await instructorUpdateBankDetail(values);
                console.log(res)
                if (res.success) {
                  toast.success(res.message);
                  setProfile((prev: any) => ({
                    ...prev,
                    bankAccountLinked: true,
                  }));
                  resetForm();
                  setShowBankForm(false);
                } else {
                  toast.error(res.message || "Bank details update failed");
                }
              } catch (error:any) {
                toast.error(error.res.message);
              }
            }}
          >
            <Form className="space-y-4">
              <InputField
                name="accountHolderName"
                type="text"
                label="Account Holder Name"
                placeholder="Enter account holder name"
              />
              <InputField
                name="accountNumber"
                type="text"
                label="Account Number"
                placeholder="Enter account number"
              />
              <InputField
                name="ifscCode"
                type="text"
                label="IFSC Code"
                placeholder="Enter IFSC code"
              />
              <InputField
                name="bankName"
                type="text"
                label="Bank Name"
                placeholder="Enter bank name"
              />
              <div className="text-right">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Update Bank Details
                </button>
              </div>
            </Form>
          </Formik>
        </div>
      )}
    </div>
  );
};

export default InstructorProfilePage;