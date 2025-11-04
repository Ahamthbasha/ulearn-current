import { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { updatePassword, getProfile } from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import Card from "../../../components/common/Card";
import { setUser } from "../../../redux/slices/userSlice";
import { useDispatch } from "react-redux";
import { type ApiError } from "../../../types/interfaces/ICommon";
import type { PasswordFormValues, ProfileData } from "../interface/studentProfileInterface";


const StudentProfilePage = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const dispatch = useDispatch();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        if (response.success) {
          dispatch(setUser(response.data));
          setProfile(response.data as ProfileData);
        } else {
          toast.error(response.message || "Failed to fetch profile ❌");
        }
      } catch (error) {
        console.error("Failed to load profile", error);
        toast.error("Something went wrong while fetching profile.");
      }
    };

    fetchProfile();
  }, [dispatch]);

  if (!profile) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 flex flex-col items-center">
      <Card
        title="👤 Student Profile"
        className="max-w-xl w-full"
        footer={
          <div className="flex flex-col gap-2 justify-center items-center">
            <button
              onClick={() => (window.location.href = "/user/editProfile")}
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
          </div>
        }
      >
        <div className="flex flex-col items-center mb-4">
          {profile.profilePicUrl ? (
            <img
              src={profile.profilePicUrl}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover mb-2 shadow"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mb-2">
              No Image
            </div>
          )}
        </div>

        <div className="space-y-4 text-sm sm:text-base">
          <p>
            <strong>Username:</strong> {profile.username}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>

          {/* Skills bullet list */}
          <div>
            <strong>Skills:</strong>
            {profile.skills && profile.skills.length > 0 ? (
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                {profile.skills.map((skill: string, index: number) => (
                  <li key={index} className="ml-4">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mt-1">None</p>
            )}
          </div>

          {/* Expertise bullet list */}
          <div>
            <strong>Expertise:</strong>
            {profile.expertise && profile.expertise.length > 0 ? (
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                {profile.expertise.map((exp: string, index: number) => (
                  <li key={index} className="ml-4">
                    {exp}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 mt-1">None</p>
            )}
          </div>

          <p>
            <strong>Status:</strong> {profile.currentStatus || "N/A"}
          </p>
        </div>
      </Card>

      {showPasswordForm && (
        <div className="w-full max-w-xl mt-6 bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">🔒 Change Password</h2>
          <Formik<PasswordFormValues>
            initialValues={{
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            }}
            validationSchema={Yup.object({
              currentPassword: Yup.string().required(
                "Current password is required"
              ),
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
            onSubmit={async (values: PasswordFormValues, { resetForm }) => {
              try {
                const formData = new FormData();
                formData.append("currentPassword", values.currentPassword);
                formData.append("newPassword", values.newPassword);

                const res = await updatePassword(formData);

                if (res.success) {
                  toast.success("Password updated successfully ✅");
                  resetForm();
                  setShowPasswordForm(false);
                } else {
                  toast.error(res.message || "Password update failed ❌");
                }
              } catch (error) {
                console.error("Password update error:", error);
                const apiError = error as ApiError;
                const errorMessage =
                  apiError?.response?.data?.message ||
                  apiError?.message ||
                  "Password update failed";
                toast.error(errorMessage);
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
    </div>
  );
};

export default StudentProfilePage;