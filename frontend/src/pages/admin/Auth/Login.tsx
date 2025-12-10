import * as Yup from "yup";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import PasswordField from "../../../components/common/PasswordField";
import { adminLogin } from "../../../api/auth/AdminAuthentication";

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const LoginPage = () => {
  const navigate = useNavigate();

  const initialValues = {
    email: "",
    password: "",
  };

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      const response = await adminLogin(data);
      console.log("login response in login page", response);

      if (response.success) {
        const email = response.data.email; // ✅ Only read when success
        localStorage.setItem("admin", JSON.stringify(email));
        toast.success(response.message);
        navigate("/admin/dashboard");
      } else {
        toast.error(response.message); // ✅ Correct error message from backend
      }
    } catch (error: unknown) {
  if (error instanceof Error) {
    console.error("Login error:", error);
  } else {
    console.error("Login error:", error);
  }
  toast.error("Login failed. Please try again.");
}
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-100">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
          ADMIN LOGIN
        </h2>

        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={onSubmit}
        >
          {() => (
            <Form className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Field
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <PasswordField name="password" placeholder="Enter password" />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition duration-200 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Login
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;