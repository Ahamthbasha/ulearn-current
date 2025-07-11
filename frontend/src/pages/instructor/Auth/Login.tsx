import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';

import PasswordField from '../../../components/common/PasswordField';
import { setInstructor } from '../../../redux/slices/instructorSlice';
import { login } from '../../../api/auth/InstructorAuthentication';
import type { Login } from '../../../types/LoginTypes';

import { getVerificationRequestByemail } from '../../../api/action/InstructorActionApi';

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

  // const onSubmit = async (data: Login) => {
  //   try {
  //     const response = await login({ email: data.email, password: data.password, role: data.role });
  //     const user = response.user;

  //     if (user) {
  //       localStorage.setItem('instructor', JSON.stringify(user));
  //       toast.success(response?.message);

  //       dispatch(setInstructor({
  //         userId: user._id,
  //         name: user.username,
  //         email: user.email,
  //         role: user.role,
  //         isBlocked: user.isBlocked,
  //         profilePicture: user.profilePicture
  //       }));

  //       if(user.isVerified){
  //         navigate('/instructor/dashboard')
  //       }else{
  //         navigate("/instructor/verification");
  //       }
        
  //     } else {
  //       toast.error(response?.message || "Login failed");
  //     }
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     toast.error("Login failed. Please try again.");
  //   }
  // };

  const onSubmit = async (data: Login) => {
  try {
    const response = await login({ email: data.email, password: data.password, role: data.role });
    const user = response.user;
    console.log("user data",user)
    if (user) {
      localStorage.setItem('instructor', JSON.stringify(user));
      toast.success(response?.message);

      dispatch(setInstructor({
        userId: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isVerified:user.isVerified,
        profilePicture: user.profilePicture
      }));

      if (user.isVerified) {
        navigate('/instructor/dashboard');
      } else {
        // Check if the instructor already submitted a verification request
        const verifyStatus = await getVerificationRequestByemail(user.email);

        console.log("verificationStatus Data",verifyStatus)

        if (verifyStatus?.data?.status) {
          navigate(`/instructor/verificationStatus/${user.email}`);
        } else {
          navigate("/instructor/verification");
        }
      }
    } else {
      toast.error(response?.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    toast.error("Login failed. Please try again.");
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
                <Link to="/instructor/verifyEmail" className="text-sm text-blue-600 hover:underline">
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
