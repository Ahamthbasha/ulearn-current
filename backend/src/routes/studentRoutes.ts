import { Router } from "express";
import {
  studentController,
  studentProfileController,
  studentCourseController,
  categoryReadOnlyController,
  studentCartController,
  studentWishlistController,
  studentCheckoutController,
  studentEnrollmentController,
  studentWalletController,
  studentWalletPaymentController,
  studentOrderController,
  studentInstructorListingController,
  studentSlotController,
  studentSlotBookingController,
  studentDashboardController,
  studentCouponController,
  studentLmsEnrollmentController,
  studentLearningPathController,
} from "../config/dependencyInjector";
import upload from "../utils/multer";
import authenticateToken from "../middlewares/authenticatedRoutes";
import { isStudent } from "../middlewares/roleAuth";
import { restrictBlockedUser } from "../middlewares/blockCheck";

const router = Router();

router.post("/signUp", studentController.studentSignUp.bind(studentController));

router.post("/resendOtp", studentController.resendOtp.bind(studentController));

router.post(
  "/createUser",
  studentController.createUser.bind(studentController),
);

router.post("/login", studentController.login.bind(studentController));

router.post("/logout", studentController.logout.bind(studentController));

router.post(
  "/verifyEmail",
  studentController.verifyEmail.bind(studentController),
);

router.post(
  "/verifyResetOtp",
  studentController.verifyResetOtp.bind(studentController),
);

router.post(
  "/forgotResendOtp",
  studentController.forgotResendOtp.bind(studentController),
);

router.post(
  "/resetPassword",
  studentController.resetPassword.bind(studentController),
);

router.post(
  "/googleLogin",
  studentController.doGoogleLogin.bind(studentController),
);

/////////////////////student profile controller/////////////////////////////////

router.get(
  "/profile",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentProfileController.getProfile.bind(studentProfileController),
);

router.put(
  "/profile",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  upload.single("profilePic"),
  studentProfileController.updateProfile.bind(studentProfileController),
);

router.put(
  "/profile/password",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentProfileController.updatePassword.bind(studentProfileController),
);

////////////////////////student side course listing///////////////////////////////////////

router.get(
  "/courses",
  studentCourseController.getAllCourses.bind(studentCourseController),
);

router.get(
  "/courses/filter",
  studentCourseController.getFilteredCourses.bind(studentCourseController),
);

router.get(
  "/courses/:courseId",
  studentCourseController.getCourseDetails.bind(studentCourseController),
);

router.get(
  "/allCourse",
  studentCourseController.getCourses.bind(studentCourseController)
)

//readCategory

router.get(
  "/categories",
  categoryReadOnlyController.getAllCategories.bind(categoryReadOnlyController),
);

/////////////////////cart management/////////////////////////////////////

router.get(
  "/cart",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCartController.getCart.bind(studentCartController),
);

router.post(
  "/addToCart",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCartController.addToCart.bind(studentCartController),
);

router.delete(
  "/remove/:itemId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCartController.removeFromCart.bind(studentCartController),
);

router.delete(
  "/clearCart",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCartController.clearCart.bind(studentCartController),
);

////////WISHLIST MANAGEMENT////////

router.post(
  "/addToWishlist",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWishlistController.addToWishlist.bind(studentWishlistController),
);

router.delete(
  "/removeWishlistCourse/:itemId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWishlistController.removeFromWishlist.bind(studentWishlistController),
);

router.get(
  "/wishlist",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWishlistController.getWishlistItems.bind(studentWishlistController),
);

router.get(
  "/check/:itemId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWishlistController.isItemInWishlist.bind(studentWishlistController),
);

///////////////////CHECKOUT MANAGEMENT////////////////////////////////////////

router.post(
  "/checkout",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCheckoutController.initiateCheckout.bind(studentCheckoutController),
);

router.post(
  "/complete",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCheckoutController.completeCheckout.bind(studentCheckoutController),
);

router.post(
  "/cancelPendingOrder",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCheckoutController.cancelPendingOrder.bind(studentCheckoutController),
);

router.post(
  "/markFailed",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCheckoutController.markOrderAsFailed.bind(studentCheckoutController),
);

//////////BOUGHT COURSE MANAGEMENT/////////////////

router.get(
  "/enrolled",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentEnrollmentController.getAllEnrolledCourses.bind(
    studentEnrollmentController,
  ),
);

router.get(
  "/enrolled/:courseId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentEnrollmentController.getEnrollmentCourseDetails.bind(
    studentEnrollmentController,
  ),
);

router.patch(
  "/enrolled/completeChapter",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentEnrollmentController.completeChapter.bind(studentEnrollmentController),
);

router.post(
  "/submitQuiz",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentEnrollmentController.submitQuizResult.bind(
    studentEnrollmentController,
  ),
);

router.get(
  "/enrollment/:courseId/allChaptersComplete",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentEnrollmentController.checkAllChaptersCompleted.bind(
    studentEnrollmentController,
  ),
);

router.get(
  "/certificate/:courseId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentEnrollmentController.getCertificateUrl.bind(
    studentEnrollmentController,
  ),
);

//wallet related routes

router.get(
  "/wallet",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWalletController.getWallet.bind(studentWalletController),
);

router.post(
  "/wallet/credit",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWalletController.creditWallet.bind(studentWalletController),
);

router.post(
  "/wallet/debit",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWalletController.debitWallet.bind(studentWalletController),
);

router.get(
  "/wallet/transactions",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWalletController.getPaginatedTransactions.bind(
    studentWalletController,
  ),
);

//wallet payment related routes

router.post(
  "/wallet/payment/createOrder",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWalletPaymentController.createOrder.bind(
    studentWalletPaymentController,
  ),
);

router.post(
  "/wallet/payment/verify",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentWalletPaymentController.verifyPayment.bind(
    studentWalletPaymentController,
  ),
);

//////////////////////order history///////////////////////////////////

router.get(
  "/orders",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentOrderController.getOrderHistory.bind(studentOrderController),
);

router.get(
  "/orders/:orderId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentOrderController.getOrderDetails.bind(studentOrderController),
);

router.get(
  "/orders/:orderId/invoice",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentOrderController.downloadInvoice.bind(studentOrderController),
);

router.post(
  "/orders/:orderId/retry",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentOrderController.retryPayment.bind(studentOrderController),
);

router.post(
  "/orders/:orderId/markFailed",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentOrderController.markOrderAsFailed.bind(studentOrderController),
);

//student side instructor Listing

router.get(
  "/instructors",
  studentInstructorListingController.listMentors.bind(
    studentInstructorListingController,
  ),
);

router.get(
  "/instructors/filters",
  studentInstructorListingController.getAvailableFilters.bind(
    studentInstructorListingController,
  ),
);

router.get(
  "/instructors/:instructorId",
  studentInstructorListingController.getMentorById.bind(
    studentInstructorListingController,
  ),
);

router.get(
  "/slots/:instructorId",
  studentSlotController.getAvailableSlots.bind(studentSlotController),
);

//slot purchase related things

router.get(
  "/checkout/:slotId/availability",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.checkSlotAvailability.bind(
    studentSlotBookingController,
  ),
);

router.post(
  "/checkout/:slotId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.initiateCheckout.bind(
    studentSlotBookingController,
  ),
);

router.post(
  "/verifySlotPayment",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.verifyPayment.bind(studentSlotBookingController),
);

router.post(
  "/verifyRetrySlotPayment",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.verifyRetryPayment.bind(
    studentSlotBookingController,
  ),
);

router.post(
  "/wallet/:slotId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.bookViaWallet.bind(studentSlotBookingController),
);

router.get(
  "/bookingHistory",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.getBookingHistory.bind(
    studentSlotBookingController,
  ),
);

router.get(
  "/booking/:bookingId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.getBookingDetail.bind(
    studentSlotBookingController,
  ),
);

router.get(
  "/booking/:bookingId/receipt",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.downloadReceipt.bind(
    studentSlotBookingController,
  ),
);

router.post(
  "/bookings/:bookingId/cancel",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.cancelPendingBooking.bind(
    studentSlotBookingController,
  ),
);

router.post(
  "/bookings/:bookingId/paymentFailed",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.handlePaymentFailure.bind(
    studentSlotBookingController,
  ),
);

router.post(
  "/bookings/:bookingId/retryPayment",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentSlotBookingController.retryPayment.bind(studentSlotBookingController),
);

////////// dashboard /////////////
router.get(
  "/dashboard",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentDashboardController.getDashboardData.bind(studentDashboardController),
);

router.get(
  "/dashboard/courseReport",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentDashboardController.getCourseReport.bind(studentDashboardController),
);

router.get(
  "/dashboard/slotReport",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentDashboardController.getSlotReport.bind(studentDashboardController),
);

router.get(
  "/dashboard/exportCourseReport",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentDashboardController.exportCourseReport.bind(
    studentDashboardController,
  ),
);

router.get(
  "/dashboard/exportSlotReport",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentDashboardController.exportSlotReport.bind(studentDashboardController),
);

router.get(
  "/getCoupons",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentCouponController.getAvailableCoupons.bind(studentCouponController),
);

// lms enrollment //

router.get(
  "/lms/enrollments",
  authenticateToken,
  isStudent,
  restrictBlockedUser,
  studentLmsEnrollmentController.getEnrolledLearningPaths.bind(
    studentLmsEnrollmentController,
  ),
);

router.get(
  "/lms/enrollments/:learningPathId",
  authenticateToken,
  isStudent,
  restrictBlockedUser,
  studentLmsEnrollmentController.getLearningPathDetails.bind(
    studentLmsEnrollmentController,
  ),
);

router.post(
  "/lms/completeCourse",
  authenticateToken,
  isStudent,
  restrictBlockedUser,
  studentLmsEnrollmentController.completeCourseAndUnlockNext.bind(
    studentLmsEnrollmentController,
  ),
);

router.get(
  "/lms/enrollments/:learningPathId/certificate",
  authenticateToken,
  isStudent,
  restrictBlockedUser,
  studentLmsEnrollmentController.getLearningPathCertificate.bind(
    studentLmsEnrollmentController,
  ),
);


//student side lms creation

router.get(
  "/learningPaths",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentLearningPathController.getStudentLearningPaths.bind(
    studentLearningPathController,
  ),
);

router.get(
  "/learningPath/:learningPathId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentLearningPathController.getLearningPathById.bind(
    studentLearningPathController,
  ),
);

router.post(
  "/createLearningPath",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  upload.single("thumbnail"),
  studentLearningPathController.createLearningPath.bind(
    studentLearningPathController,
  ),
);

router.put(
  "/learningPath/:learningPathId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  upload.single("thumbnail"),
  studentLearningPathController.updateLearningPath.bind(
    studentLearningPathController,
  ),
);

router.delete(
  "/learningPath/:learningPathId",
  authenticateToken,
  restrictBlockedUser,
  isStudent,
  studentLearningPathController.deleteLearningPath.bind(
    studentLearningPathController,
  ),
);

export default router;