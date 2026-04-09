import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "../../../components/common/Card";
import {
  instructorGetProfile,
  instructorUpdateProfile,
} from "../../../api/action/InstructorActionApi";
import { useDispatch } from "react-redux";
import { setInstructor } from "../../../redux/slices/instructorSlice";
import type { ProfileFormValues, ProfileResponse, UpdateProfileResponse } from "../interface/instructorProfileInterface";

const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .matches(
      /^[a-zA-Z0-9_ ]{3,30}$/,
      "Name must be 3–30 characters and can contain letters, numbers, spaces, or underscores"
    )
    .required("Name is required"),
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
        return expertise.every((exp) =>
          /^(?=.*[a-zA-Z])[a-zA-Z0-9\s\-_]{2,50}$/.test(exp)
        );
      }
    ),
});

const InstructorProfileEditPage = () => {
  const [initialValues, setInitialValues] = useState<ProfileFormValues | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string>("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await instructorGetProfile() as ProfileResponse;
        if (response.success) {
          const profile = response.data;
          setInitialValues({
            name: profile.instructorName || "",
            skills: profile.skills?.join(", ") || "",
            expertise: profile.expertise?.join(", ") || "",
            profilePic: null,
          });
          // Cloudinary URL is directly accessible
          if (profile.profilePicUrl) {
            setPreviewImage(profile.profilePicUrl);
          }
        }
      } catch (err) {
        console.error("Error fetching profile", err);
        toast.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (values: ProfileFormValues) => {
    const formData = new FormData();
    formData.append("username", values.name.trim());
    formData.append(
      "skills",
      JSON.stringify(values.skills.split(",").map((s: string) => s.trim()))
    );
    formData.append(
      "expertise",
      JSON.stringify(values.expertise.split(",").map((e: string) => e.trim()))
    );
    if (values.profilePic) {
      formData.append("profilePic", values.profilePic);
    }

    try {
      const response = await instructorUpdateProfile(formData) as UpdateProfileResponse;
      if (response.success) {
        dispatch(
          setInstructor({
            userId: response.data._id,
            name: response.data.username,
            email: response.data.email,
            role: response.data.role,
            isBlocked: response.data.isBlocked ? "true" : "false",
            isVerified: response.data.isVerified,
            profilePicture: response.data.profilePicUrl || null,
          })
        );
        toast.success("Profile updated successfully");
        setTimeout(() => {
          navigate("/instructor/profile");
        }, 1500);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      console.error("Update error", err);
      toast.error("Something went wrong");
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: File | null) => void
  ) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    
    // Clear previous error
    setImageError("");
    
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];
    
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = "Only image files (JPG, JPEG, PNG, WebP) are allowed";
        setImageError(errorMsg);
        toast.error(errorMsg);
        fileInput.value = "";
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        const errorMsg = "Image size must be less than 5MB";
        setImageError(errorMsg);
        toast.error(errorMsg);
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
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageError = () => {
    console.error("Failed to load profile image from Cloudinary");
    setPreviewImage(null);
    toast.warning("Could not load profile image");
  };

  if (!initialValues) {
    return (
      <div className="p-6 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex justify-center">
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
      <Card title="✏️ Edit Instructor Profile" className="max-w-xl w-full">
        <Formik
          initialValues={initialValues}
          validationSchema={ProfileSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form className="space-y-4">
              <InputField
                name="name"
                label="Name"
                type="text"
                placeholder="Enter your name"
              />
              <InputField
                name="skills"
                label="Skills (comma separated)"
                type="text"
                placeholder="e.g., JavaScript, React, Node.js"
              />
              <InputField
                name="expertise"
                label="Expertise (comma separated)"
                type="text"
                placeholder="e.g., MERN Stack, Web Development"
              />

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-sm">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={(event) => handleFileChange(event, setFieldValue)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Allowed formats: JPG, JPEG, PNG, WebP (Max size: 5MB)
                </p>
                {imageError && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ {imageError}
                  </p>
                )}

                {previewImage && (
                  <div className="mt-3">
                    <img
                      src={previewImage}
                      alt="Profile Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                      onError={handleImageError}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Profile picture (Cloudinary)
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-between gap-4">
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
                  onClick={() => navigate("/instructor/profile")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-blue-600 text-white px-4 py-2 rounded transition-colors ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default InstructorProfileEditPage;