import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/admin/Auth/Login";
import AdminLayout from "../layouts/AdminLayout";
import AdminSessionRoute from "../Protecter/AdminSessionRoute";
import PrivateRoute from "../Protecter/AdminPrivateRoute";

// Pages
import UserList from "../pages/admin/userList/UserList";
import InstructorList from "../pages/admin/instructorList/InstructorList";
import VerificationPage from "../pages/admin/verification/VerificationPage";
import VerificationDetailsPage from "../pages/admin/verification/VerificationDetailPage";

// Category Pages
import AdminCategoryListPage from "../pages/admin/category/AdminCategoryList";
import AddCategoryPage from "../pages/admin/category/AddCategoryPage";
import EditCategoryPage from "../pages/admin/category/EditCategory";
import AdminCourseManagementPage from "../pages/admin/course/AdminCourseManagementPage";
import AdminWalletPage from "../pages/admin/wallet/AdminWalletPage";
import MembershipPlanPage from "../pages/admin/membership/MembershipPlanPage";
import AddMembershipPlan from "../pages/admin/membership/AddMembershipPlan";
import EditMembershipPlanPage from "../pages/admin/membership/EditMembershipPlan";
import Orders from "../pages/admin/purchaseHistory/Orders";
import MembershipOrderDetail from "../pages/admin/purchaseHistory/MembershipOrderDetail";
import NotFound from "../components/common/NotFound";
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import AdminCourseDetailPage from "../pages/admin/course/AdminCourseDetailPage";
import Withdrawal from "../pages/admin/withdrawal/Withdrawal";
import WithdrawalDetailsPage from "../pages/admin/withdrawal/WithdrawalDetails";
import CouponListPage from "../pages/admin/Coupon/CouponManagementPage";
import AddCouponPage from "../pages/admin/Coupon/AddCoupon";
import EditCouponPage from "../pages/admin/Coupon/EditCoupon";
import AdminCourseOfferDetailPage from "../pages/admin/courseOffer/AdminCourseOfferDetailPage";
import AdminCourseOfferListPage from "../pages/admin/courseOffer/CourseOffersPage";
import AdminReviewManagementPage from "../pages/admin/ReviewManagement/AdminReviewManagementPage";
import ReviewDetailPage from "../pages/admin/ReviewManagement/ReviewDetailPage";

//wallet

const AdminRouter = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route
        path="login"
        element={
          <AdminSessionRoute>
            <LoginPage />
          </AdminSessionRoute>
        }
      />

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="users" element={<UserList />} />
          <Route path="instructors" element={<InstructorList />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route
            path="verificationDetail/:email"
            element={<VerificationDetailsPage />}
          />

          {/* Category Routes */}
          <Route path="category" element={<AdminCategoryListPage />} />
          <Route path="addCategory" element={<AddCategoryPage />} />
          <Route
            path="category/edit/:categoryId"
            element={<EditCategoryPage />}
          />

          {/* Course Routes */}
          <Route path="courses" element={<AdminCourseManagementPage />} />
          <Route path="courses/:courseId" element={<AdminCourseDetailPage/>}/>
          {/* review management */}
          <Route path="course/reviews/:courseId" element={<AdminReviewManagementPage/>}/>
          <Route path="reviews/:reviewId" element={<ReviewDetailPage/>}/>
          {/* wallet  */}
          <Route path="wallet" element={<AdminWalletPage />} />

          {/* membership */}
          <Route path="membership" element={<MembershipPlanPage/>}/>
          <Route path="membership/add" element={<AddMembershipPlan/>}/>
          <Route path="membership/edit/:membershipId" element={<EditMembershipPlanPage/>}/>

          {/* purchase history */}
          <Route path="orders" element={<Orders/>}/>
          <Route path="membershipPurchase/:txnId" element={<MembershipOrderDetail/>}/>

          <Route path="dashboard" element={<AdminDashboard/>}/>

          {/* withdrawal request */}
          <Route path="withdrawal" element={<Withdrawal/>}/>
          <Route path="withdrawals/:requestId" element={<WithdrawalDetailsPage/>}/>

          {/* coupon */}
          <Route path="coupons" element={<CouponListPage/>}/>
          <Route path="coupons/add" element={<AddCouponPage/>}/>
          <Route path="coupons/edit/:couponId" element={<EditCouponPage/>}/>

          {/* course offer */}

          <Route path="courseOffers" element={<AdminCourseOfferListPage/>}/>
          <Route path="courseOffer/:offerId" element={<AdminCourseOfferDetailPage/>}/>
        </Route>

      </Route>
      <Route path="*" element={<NotFound/>}/>
    </Routes>
  );
};

export default AdminRouter;
