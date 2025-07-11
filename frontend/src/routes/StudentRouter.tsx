import {Routes,Route} from 'react-router-dom'
import StudentLayout from '../layouts/StudentLayout'
import UserSessionRoute from '../Protecter/UserSessionRoute'
import LandingPage from '../pages/LandingPage'
import EnrollPage from '../pages/EnrollPage'
import SignUp from '../pages/student/Auth/SignUp'
import LoginPage from '../pages/student/Auth/Login'
import OTPVerification from '../pages/student/Auth/OTPVerification'
import ForgotPassword from '../pages/student/Auth/ForgotPassword'
import ResetVerificationOTP from '../pages/student/Auth/ResetVerificationOtp'
import ResetPassword from '../pages/student/Auth/ResetPassword'
import StudentSidebarLayout from '../layouts/StudentSidebarLayout'
import StudentProfilePage from '../pages/student/profile/StudentProfilePage'
import StudentProfileEditPage from '../pages/student/profile/StudentEditProfile'
import StudentDashboard from '../pages/student/StudentDashboard'
import PrivateRoute from '../Protecter/UserPrivateRoute'
import CourseDetailPage from '../pages/student/course/CourseDetailPage'
import CourseListPage from '../pages/student/course/CourseListPage'
import CartPage from '../pages/student/cart/CartPage'
import WishlistPage from '../pages/student/wishlist/WishlistPage'
import CheckoutPage from '../pages/student/checkout/CheckoutPage'
import EnrolledCoursesPage from '../pages/student/enrollCourses/EnrolledCoursesPage'
import EnrolledCourseDetailPage from '../pages/student/enrollCourses/EnrolledCourseDetailPage.'
import QuizAttemptPage from '../pages/student/enrollCourses/QuizAttempPage'
import WalletPage from '../pages/student/wallet/WalletPage'
import StudentOrderHistoryPage from '../pages/student/order/StudentOrderHistoryPage'
import StudentOrderDetailPage from '../pages/student/order/StudentOrderDetailPage'
import NotFound from '../components/common/NotFound'
const StudentRouter = () => {
  return (
    <Routes>
        <Route element={<StudentLayout />}>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/enrollPage" element={<EnrollPage/>}/>
        <Route path="/user/signUp" element={<UserSessionRoute><SignUp/></UserSessionRoute>}/>
        <Route path='/user/login' element={<UserSessionRoute><LoginPage/></UserSessionRoute>}/>
        <Route path="/user/verifyOtp" element={<UserSessionRoute><OTPVerification/></UserSessionRoute>}/>
        <Route path='/user/course/:courseId' element={<CourseDetailPage/>}/>
        <Route path='/user/courses' element={<CourseListPage/>}/>

        {/* reset password in case of forgot password */}
        <Route path='/user/verifyEmail' element={<ForgotPassword/>} />
        <Route path='/user/forgotPasswordOtp' element={<ResetVerificationOTP/>}/>
        <Route path='/user/resetPassword' element={<ResetPassword/>}/>
        </Route>

        {/* profile management */}
        <Route element={<PrivateRoute/>}>
          <Route path ='/user' element={<StudentSidebarLayout/>} >
            <Route path='dashboard' element={<StudentDashboard/>}/>
            <Route path='profile' element={<StudentProfilePage/>}/>
            <Route path='editProfile' element={<StudentProfileEditPage/>}/>
            <Route path='cart' element={<CartPage/>}/>
            <Route path='wishlist' element={<WishlistPage/>}/>
            <Route path='checkout' element={<CheckoutPage/>}/>
            <Route path='enrolled' element={<EnrolledCoursesPage/>}/>
            <Route path='wallet' element={<WalletPage/>}/>
            <Route path='order' element={<StudentOrderHistoryPage/>}/>
            <Route path='order/:orderId' element={<StudentOrderDetailPage/>}/>
          </Route>
          
          {/* Enrolled course detail - outside sidebar layout for better UX */}
          <Route path='/user/enrolled/:courseId' element={<EnrolledCourseDetailPage/>}/>
          <Route path='/quiz/:courseId/:quizId' element={<QuizAttemptPage />}/>
        </Route>

        <Route path="*" element={<NotFound/>}/>
    </Routes>
  )
}

export default StudentRouter