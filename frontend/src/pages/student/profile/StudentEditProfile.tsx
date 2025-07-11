import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { getProfile, updateProfile } from "../../../api/action/StudentAction";
import Card from "../../../components/common/Card";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/slices/userSlice";

const ProfileSchema = Yup.object().shape({
  username: Yup.string()
    .matches(/^[a-zA-Z0-9_]{3,30}$/, "Username must be 3-30 characters, only letters, numbers, underscores")
    .required("Username is required"),

  skills: Yup.string()
    .test("valid-skills", "Please enter at least one skill", (value) => {
      if (!value) return false;
      const skills = value.split(",").map((s) => s.trim()).filter(Boolean);
      return skills.length > 0;
    }),

  expertise: Yup.string()
    .test("valid-expertise", "Please enter at least one expertise", (value) => {
      if (!value) return false;
      const expertise = value.split(",").map((s) => s.trim()).filter(Boolean);
      return expertise.length > 0;
    }),

  currentStatus: Yup.string()
  .trim()
  .matches(/^(?!\s*$).+$/, "Status cannot be empty or just spaces")
  .min(3, "Status must be at least 3 characters")
  .required("Current status is required"),

});


const StudentProfileEditPage = () => {
  const [initialValues, setInitialValues] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch()
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        if (response.success) {
          const profile = response.data;
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

  const handleSubmit = async (values: any) => {
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("skills", JSON.stringify(values.skills.split(",").map((s: string) => s.trim())));
    formData.append("expertise", JSON.stringify(values.expertise.split(",").map((e: string) => e.trim())));
    formData.append("currentStatus", values.currentStatus);
    if (values.profilePic) {
      formData.append("profilePic", values.profilePic);
    }

    try {
      const response = await updateProfile(formData);
      if (response.success) {
        dispatch(setUser(response.data))
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
              <InputField name="username" label="Username" type="text" placeholder="Enter username" />
              <InputField name="skills" label="Skills (comma separated)" type="text" placeholder="e.g. React, Node" />
              <InputField name="expertise" label="Expertise (comma separated)" type="text" placeholder="e.g. Full Stack" />
              <InputField name="currentStatus" label="Current Status" type="text" placeholder="e.g. Developer" />

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-sm">Profile Picture</label>

<input
  type="file"
  accept="image/*"
  onChange={(event: any) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files[0];

    if (file) {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        toast.error("Only image files (JPG, PNG, GIF, WebP) are allowed");
        fileInput.value = ""; // ❌ Clear invalid file
        return;
      }

      setFieldValue("profilePic", file);

      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }}
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
