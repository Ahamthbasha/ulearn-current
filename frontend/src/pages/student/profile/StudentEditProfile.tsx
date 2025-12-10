import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { getProfile, updateProfile } from "../../../api/action/StudentAction";
import Card from "../../../components/common/Card";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/slices/userSlice";
import type { ProfileData, ProfileFormValues } from "../../../types/interfaces/IStudentInterface";

const ProfileSchema = Yup.object().shape({
  username: Yup.string()
    .trim()
    .matches(
      /^[a-zA-Z0-9_]{3,30}$/,
      "Username must be 3-30 characters and can contain letters, numbers, or underscores"
    )
    .matches(
      /[a-zA-Z]/,
      "Username must contain at least one letter"
    )
    .required("Username is required"),

  skills: Yup.string()
    .required("Skills are required")
    .test(
      "valid-skills",
      "Each skill must be 2–50 characters, contain at least one letter, and can include numbers, spaces, hyphens, or underscores. At least one valid skill is required (max 10 skills)",
      (value) => {
        if (!value) return false;
        const skills = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (skills.length === 0 || skills.length > 10) return false;
        // Each skill must contain at least one letter and match the pattern
        return skills.every((skill) =>
          /^(?=.*[a-zA-Z])[a-zA-Z0-9\s\-_]{2,50}$/.test(skill)
        );
      }
    ),

  expertise: Yup.string()
    .required("Expertise is required")
    .test(
      "valid-expertise",
      "Each expertise must be 2–50 characters, contain at least one letter, and can include numbers, spaces, hyphens, or underscores. At least one valid expertise is required (max 10 expertise)",
      (value) => {
        if (!value) return false;
        const expertise = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (expertise.length === 0 || expertise.length > 10) return false;
        // Each expertise must contain at least one letter and match the pattern
        return expertise.every((exp) =>
          /^(?=.*[a-zA-Z])[a-zA-Z0-9\s\-_]{2,50}$/.test(exp)
        );
      }
    ),

  currentStatus: Yup.string()
    .trim()
    .min(3, "Status must be at least 3 characters")
    .max(100, "Status must not exceed 100 characters")
    .matches(
      /^(?=.*[a-zA-Z])[a-zA-Z0-9\s\-_]{3,100}$/,
      "Status must contain at least one letter and can include numbers, spaces, hyphens, or underscores"
    )
    .test(
      "not-blank",
      "Status cannot be only spaces",
      (value) => !!value && value.trim().length >= 3
    )
    .required("Current status is required"),
});

const StudentProfileEditPage = () => {
  const [initialValues, setInitialValues] = useState<ProfileFormValues | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        if (response.success) {
          const profile = response.data as ProfileData;
          setInitialValues({
            username: profile.username || "",
            skills: profile.skills?.join(", ") || "",
            expertise: profile.expertise?.join(", ") || "",
            currentStatus: profile.currentStatus || "",
            profilePic: null,
          });
          if (profile.profilePicUrl) {
            setPreviewImage(profile.profilePicUrl);
          }
        }
      } catch (err) {
        console.error("Error loading profile", err);
        toast.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (values: ProfileFormValues) => {
    const formData = new FormData();
    formData.append("username", values.username.trim());
    formData.append(
      "skills",
      JSON.stringify(values.skills.split(",").map((s: string) => s.trim()))
    );
    formData.append(
      "expertise",
      JSON.stringify(values.expertise.split(",").map((e: string) => e.trim()))
    );
    formData.append("currentStatus", values.currentStatus.trim());
    if (values.profilePic) {
      formData.append("profilePic", values.profilePic);
    }

    try {
      const response = await updateProfile(formData);
      if (response.success) {
        dispatch(setUser(response.data));
        toast.success("Profile updated successfully");
        setTimeout(() => {
          navigate("/user/profile");
        }, 1500);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile", err);
      toast.error("Something went wrong");
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: File | null) => void
  ) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    if (file) {
      if (!validImageTypes.includes(file.type)) {
        toast.error("Only image files (JPG, JPEG, PNG, WebP) are allowed");
        fileInput.value = "";
        return;
      }

      setFieldValue("profilePic", file);

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPreviewImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!initialValues) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 flex justify-center">
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
      <Card title="✏️ Edit Profile" className="max-w-xl w-full">
        <Formik
          initialValues={initialValues}
          validationSchema={ProfileSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue }) => (
            <Form className="space-y-4">
              <InputField
                name="username"
                label="Username"
                type="text"
                placeholder="Enter username (e.g., john_doe123)"
              />
              <InputField
                name="skills"
                label="Skills (comma separated)"
                type="text"
                placeholder="e.g., React, Node.js, TypeScript"
              />
              <InputField
                name="expertise"
                label="Expertise (comma separated)"
                type="text"
                placeholder="e.g., Full Stack Development, API Design"
              />
              <InputField
                name="currentStatus"
                label="Current Status"
                type="text"
                placeholder="e.g., Software Developer, Learning MERN Stack"
              />

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-sm">
                  Profile Picture
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFileChange(event, setFieldValue)}
                />

                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-24 h-24 rounded-full mt-2 object-cover"
                  />
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  onClick={() => navigate("/user/profile")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default StudentProfileEditPage;