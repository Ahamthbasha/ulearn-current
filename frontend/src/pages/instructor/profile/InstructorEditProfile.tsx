import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Card from "../../../components/common/Card";
import { instructorGetProfile, instructorUpdateProfile } from "../../../api/action/InstructorActionApi";
import { useDispatch } from "react-redux";
import { setInstructor } from "../../../redux/slices/instructorSlice";

const ProfileSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .matches(/^[a-zA-Z0-9_ ]{3,30}$/, "Name must be 3–30 characters and can contain letters, numbers, spaces, or underscores")
    .required("Name is required"),

  skills: Yup.string()
    .test("valid-skills", "Please enter at least one skill", (value) => {
      if (!value) return false;
      const skills = value.split(",").map((s) => s.trim()).filter(Boolean);
      return skills.length > 0;
    }),

  expertise: Yup.string()
    .test("valid-expertise", "Please enter at least one expertise", (value) => {
      if (!value) return false;
      const exp = value.split(",").map((s) => s.trim()).filter(Boolean);
      return exp.length > 0;
    }),
});

const InstructorProfileEditPage = () => {
  const [initialValues, setInitialValues] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await instructorGetProfile();
        if (response.success) {
          const profile = response.data;
          setInitialValues({
            name: profile.username || "",
            skills: profile.skills?.join(", ") || "",
            expertise: profile.expertise?.join(", ") || "",
            profilePic: null,
          });
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

  const handleSubmit = async (values: any) => {
    const formData = new FormData();
    formData.append("username", values.name.trim());
    formData.append("skills", JSON.stringify(values.skills.split(",").map((s: string) => s.trim())));
    formData.append("expertise", JSON.stringify(values.expertise.split(",").map((e: string) => e.trim())));
    if (values.profilePic) {
      formData.append("profilePic", values.profilePic);
    }

    try {
      const response = await instructorUpdateProfile(formData);
      if (response.success) {
        dispatch(setInstructor({
          userId: response.data._id,
          name: response.data.username,
          email: response.data.email,
          role: response.data.role,
          isBlocked: response.data.isBlocked,
          isVerified: response.data.isVerified,
          profilePicture: response.data.profilePicUrl,
        }));
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

  if (!initialValues) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 flex justify-center">
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
      <Card title="✏️ Edit Instructor Profile" className="max-w-xl w-full">
        <Formik
          initialValues={initialValues}
          validationSchema={ProfileSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue }) => (
            <Form className="space-y-4">
              <InputField name="name" label="Name" type="text" placeholder="Enter your name" />
              <InputField name="skills" label="Skills (comma separated)" type="text" placeholder="e.g. JavaScript, React" />
              <InputField name="expertise" label="Expertise (comma separated)" type="text" placeholder="e.g. MERN Stack" />

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-sm">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event: any) => {
                    const fileInput = event.currentTarget;
                    const file = fileInput.files[0];
                    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

                    if (file) {
                      if (!allowedTypes.includes(file.type)) {
                        toast.error("Only image files (JPG, JPEG, PNG, WebP) are allowed");
                        fileInput.value = ""; // ❌ Clear the invalid file
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
                  onClick={() => navigate("/instructor/profile")}
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

export default InstructorProfileEditPage;
