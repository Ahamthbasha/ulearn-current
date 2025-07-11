import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import PasswordField from '../../../components/common/PasswordField';
import { adminLogin } from '../../../api/auth/AdminAuthentication';

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required")
});

const LoginPage = () => {
  const navigate = useNavigate();

  const initialValues = {
    email: '',
    password: '',
  };

  const onSubmit = async (data: { email: string; password: string }) => {
  try {
    const response = await adminLogin(data);
    console.log('login response in login page', response);

    if (response.success) {
      const email = response.data.email; // ✅ Only read when success
      localStorage.setItem("admin", JSON.stringify(email));
      toast.success(response.message);
      navigate('/admin/home');
    } else {
      toast.error(response.message); // ✅ Correct error message from backend
    }
  } catch (error: any) {
    console.error("Login error:", error);
    toast.error("Login failed. Please try again.");
  }
};


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">ADMIN LOGIN</h2>

        <Formik initialValues={initialValues} validationSchema={loginSchema} onSubmit={onSubmit}>
          {() => (
            <Form className="space-y-4">
              <div>
                <Field name="email" type="email" placeholder="Email" className="w-full p-2 border rounded" />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
              </div>

              <div>
                <PasswordField name="password" placeholder="Password" />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
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
