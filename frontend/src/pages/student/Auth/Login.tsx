import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';

import PasswordField from '../../../components/common/PasswordField';
import { setUser } from '../../../redux/slices/userSlice';
import { login } from '../../../api/auth/UserAuthentication';
import type { Login } from '../../../types/LoginTypes';

// ✅ Improved validation
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Enter a valid email address")
    .required("Email is required"),

  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/\d/, "Must contain at least one number")
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const initialValues = {
    email: '',
    password: '',
    role: '',
    isBlocked: false
  };

  const onSubmit = async (data: Login) => {
    try {
      const response = await login({ email: data.email, password: data.password, role: data.role });
      const user = response.user;

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        toast.success(response?.message);

        dispatch(setUser({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isBlocked: user.isBlocked,
          profilePicUrl: user.profilePicture
        }));

        navigate('/');
      } else {
        toast.error(response?.message || "Login failed");
      }
    } catch (error:any) {
      console.error("Login error:", error);
      const errorMessage = error?.response?.data?.message || "Login in failed.Please try again"
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-100">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">Welcome Back</h2>

        <Formik initialValues={initialValues} validationSchema={loginSchema} onSubmit={onSubmit}>
          {() => (
            <Form className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <Field name="email" type="email" placeholder="you@example.com" className="w-full mt-1 p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <PasswordField name="password" placeholder="Enter password" />
              </div>

              <div className="flex justify-between items-center">
                <Link to="/user/verifyEmail" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
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
