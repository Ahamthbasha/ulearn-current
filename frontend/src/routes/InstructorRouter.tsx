import { Routes,Route } from 'react-router-dom'

import SignUp from '../pages/instructor/Auth/SignUp'
import InstructorHeader from '../components/InstructorComponents/InstructorHeader'
import OTPVerification from '../pages/instructor/Auth/OTPVerification'
import LoginPage from '../pages/instructor/Auth/Login'
import ForgotPassword from '../pages/instructor/Auth/ForgotPassword'
import ResetVerificationOTP from '../pages/instructor/Auth/ResetVerificationOtp'
import ResetPassword from '../pages/instructor/Auth/ResetPassword'
import InstructorSessionRoute from '../Protecter/InstructorSessionRoute'

import VerificationForm from '../pages/instructor/Verification/InstructorVerificationForm'
import InstructorVerificationStatus from '../pages/instructor/Verification/InstructorVerificationStatus'
import InstructorSidebarLayout from '../layouts/InstructorSidebarLayout'
import InstructorDashboard from '../pages/instructor/InstructorDashboard'
import InstructorProfilePage from '../pages/instructor/profile/InstructorProfilePage'
import InstructorProfileEditPage from '../pages/instructor/profile/InstructorEditProfile'


import CourseListPage from '../pages/instructor/course/CourseList'

import PrivateRoute from '../Protecter/InstructorPrivateRoute'
import CourseCreatePage from '../pages/instructor/course/CourseCreate'
import CourseEditPage from '../pages/instructor/course/CourseEditPage'
import CourseManagementPage from '../pages/instructor/course/CourseManagementPage'
import ChapterManagementPage from '../pages/instructor/chapter/ChapterManagementPage'
import AddChapterPage from '../pages/instructor/chapter/AddChapterPage'
import EditChapterPage from '../pages/instructor/chapter/EditChapterPage'
import QuizManagementPage from '../pages/instructor/quiz/QuizManagementpage'
import AddQuizPage from '../pages/instructor/quiz/AddQuizPage'
import EditQuizPage from '../pages/instructor/quiz/EditQuizPage'
import SpecificDashboardPage from '../pages/instructor/specificDashboard/SpecificDashboardPage'
import InstructorWalletPage from '../pages/instructor/wallet/InstructorWalletPage'
import Membership from '../pages/instructor/membership/Membership'
import SlotPage from '../pages/instructor/slot/SlotPage'
import MentorRoute from '../Protecter/MentorRoute'
import MembershipCheckoutPage from '../pages/instructor/membership/MembershipCheckoutPage'
import Orders from '../pages/instructor/purchaseHistory/Orders'
import MembershipOrderDetail from '../pages/instructor/purchaseHistory/MembershipOrderDetail'
import NotFound from '../components/common/NotFound'
import SlotHistoryPage from '../pages/instructor/slot/SlotHistoryPage'
import SlotDetailPage from '../pages/instructor/slot/SlotDetailPage'
import LearningPathListPage from '../pages/instructor/learningPath/LearningPathList'
import LearningPathCreatePage from '../pages/instructor/learningPath/LearningPathCreatepage'
import LearningPathEditPage from '../pages/instructor/learningPath/LearningPathEditPage'
import LearningPathViewPage from '../pages/instructor/learningPath/LearningPathViewPage'
import InstructorCourseOffersPage from '../pages/instructor/courseOffer/InstructorCourseOfferPage'
import AddCourseOfferPage from '../pages/instructor/courseOffer/AddCourseOfferPage'
import EditInstructorCourseOfferPage from '../pages/instructor/courseOffer/EditCourseOfferPage'
import OfferDetailsPage from '../pages/instructor/courseOffer/CourseOfferDetailPage'


const InstructorRouter = () => {
  return (
    <Routes>
      <Route element={<InstructorHeader/>}>
      <Route path='signUp' element={<SignUp/>}/>
       <Route path="verifyOtp" element={<OTPVerification/>}/>
        
        <Route element={<InstructorSessionRoute/>}>
        <Route path="login" element={<LoginPage />} />
        </Route>

        <Route path='verifyEmail' element={<ForgotPassword/>}/>
        <Route path='forgotPasswordOtp' element={<ResetVerificationOTP/>}/>
        <Route path='resetPassword' element={<ResetPassword/>}/>

        <Route path='verification' element={<VerificationForm/>}/>
        <Route path='verificationStatus/:email' element={<InstructorVerificationStatus/>}/>
        <Route path='reverify' element={<VerificationForm/>}/>
      </Route>

  <Route element={<PrivateRoute />}>
  <Route element={<InstructorSidebarLayout />}>
    <Route path="dashboard" element={<InstructorDashboard />} />
    <Route path="profile" element={<InstructorProfilePage />} />
    <Route path="editProfile" element={<InstructorProfileEditPage />} />

    <Route path='courses' element={<CourseListPage/>}/>
    <Route path='createCourse' element ={<CourseCreatePage/>}/>
    <Route path='editCourse/:courseId' element={<CourseEditPage/>}/>
    <Route path='course/manage/:courseId' element={<CourseManagementPage/>}/>
    <Route path='courseDashboard/:courseId' element={<SpecificDashboardPage/>}/>

    {/* chapterManage */}
    <Route path='course/:courseId/chapters' element={<ChapterManagementPage/>} />
    <Route path='course/:courseId/chapters/add' element={<AddChapterPage/>}/>
    <Route path='course/:courseId/chapters/:chapterId/edit' element={<EditChapterPage/>}/>

    {/* quizManage */}
    <Route path='course/:courseId/quiz' element= {<QuizManagementPage/>}/>
    <Route path='course/:courseId/quiz/add' element={<AddQuizPage/>}/>
    <Route path="course/:courseId/quiz/edit/:quizId" element={<EditQuizPage />} />

    {/* learning Path management */}

    <Route path='learningPath' element={<LearningPathListPage/>}/>
    <Route path='learningPath/create' element={<LearningPathCreatePage/>}/>
    <Route path='learningPath/edit/:learningPathId' element={<LearningPathEditPage/>}/>
    <Route path='learningPath/:learningPathId' element={<LearningPathViewPage/>}/>

    <Route path="wallet" element={<InstructorWalletPage/>}/>
    <Route path="membership" element={<Membership/>} />
    <Route path="membership/checkout/:planId" element={<MembershipCheckoutPage/>} />
    <Route path="purchaseHistory" element={<Orders/>}/>
    <Route path="membershipOrders/:orderId" element={<MembershipOrderDetail/>}/>

{/* offer management */}
    <Route path='courseOffers' element={<InstructorCourseOffersPage/>}/>
    <Route path='addCourseOffer' element={<AddCourseOfferPage/>}/>
    <Route path='editCourseOffer/:offerId' element={<EditInstructorCourseOfferPage/>}/>
    <Route path='courseOffer/:offerId' element={<OfferDetailsPage/>}/>


{/* slot related */}
    <Route element={<MentorRoute/>}>
    <Route path='slots' element={<SlotPage/>}/>
    <Route path="slotsHistory" element={<SlotHistoryPage/>}/>
    <Route path="slots/:slotId" element={<SlotDetailPage/>}/>
    
    </Route>
  </Route>
</Route>

<Route path="*" element={<NotFound/>}/>
    </Routes>
  )
}

export default InstructorRouter
