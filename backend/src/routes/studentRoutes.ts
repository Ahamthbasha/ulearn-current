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
} from "../config/dependencyInjector";
import upload from "../utils/multer";
import authenticateToken from "../middlewares/AuthenticatedRoutes";
import { isStudent } from "../middlewares/roleAuth";

const router = Router();

router.post("/signUp", studentController.studentSignUp.bind(studentController));

router.post("/resendOtp", studentController.resendOtp.bind(studentController));

router.post(
  "/createUser",
  studentController.createUser.bind(studentController)
);

router.post("/login", studentController.login.bind(studentController));

router.post("/logout", studentController.logout.bind(studentController));

router.post(
  "/verifyEmail",
  studentController.verifyEmail.bind(studentController)
);

router.post(
  "/verifyResetOtp",
  studentController.verifyResetOtp.bind(studentController)
);

router.post(
  "/forgotResendOtp",
  studentController.forgotResendOtp.bind(studentController)
);

router.post(
  "/resetPassword",
  studentController.resetPassword.bind(studentController)
);

router.post(
  "/googleLogin",
  studentController.doGoogleLogin.bind(studentController)
);

//isBlocked checker
router.get(
  "/statusCheck",
  studentController.statusCheck.bind(studentController)
);

/////////////////////student profile controller/////////////////////////////////

router.get(
  "/profile",
  authenticateToken,
  isStudent,
  studentProfileController.getProfile.bind(studentProfileController)
);

router.put(
  "/profile",
  authenticateToken,
  isStudent,
  upload.single("profilePic"),
  studentProfileController.updateProfile.bind(studentProfileController)
);

router.put(
  "/profile/password",
  authenticateToken,
  isStudent,
  studentProfileController.updatePassword.bind(studentProfileController)
);

////////////////////////student side course listing///////////////////////////////////////

router.get(
  "/courses",
  studentCourseController.getAllCourses.bind(studentCourseController)
);

router.get(
  "/courses/filter",
  studentCourseController.getFilteredCourses.bind(studentCourseController)
);

router.get(
  "/courses/:courseId",
  studentCourseController.getCourseDetails.bind(studentCourseController)
);
//readCategory

router.get(
  "/categories",
  categoryReadOnlyController.getAllCategories.bind(categoryReadOnlyController)
);

/////////////////////cart management/////////////////////////////////////

router.get(
  "/cart",
  authenticateToken,
  isStudent,
  studentCartController.getCart.bind(studentCartController)
);

router.post(
  "/addToCart",
  authenticateToken,
  isStudent,
  studentCartController.addToCart.bind(studentCartController)
);

router.delete(
  "/remove/:courseId",
  authenticateToken,
  isStudent,
  studentCartController.removeFromCart.bind(studentCartController)
);

router.delete(
  "/clearCart",
  authenticateToken,
  isStudent,
  studentCartController.clearCart.bind(studentCartController)
);

////////WISHLIST MANAGEMENT////////

router.post(
  "/addToWishlist",
  authenticateToken,
  isStudent,
  studentWishlistController.addToWishlist.bind(studentWishlistController)
);

router.delete(
  "/removeWishlistCourse/:courseId",
  authenticateToken,
  isStudent,
  studentWishlistController.removeFromWishlist.bind(studentWishlistController)
);

router.get(
  "/wishlist",
  authenticateToken,
  isStudent,
  studentWishlistController.getWishlistCourses.bind(studentWishlistController)
);

router.get(
  "/check/:courseId",
  authenticateToken,
  isStudent,
  studentWishlistController.isCourseInWishlist.bind(studentWishlistController)
);

///////////////////CHECKOUT MANAGEMENT////////////////////////////////////////

router.post(
  "/checkout",
  authenticateToken,
  isStudent,
  studentCheckoutController.initiateCheckout.bind(studentCheckoutController)
);

router.post(
  "/complete",
  authenticateToken,
  isStudent,
  studentCheckoutController.completeCheckout.bind(studentCheckoutController)
);

//////////BOUGHT COURSE MANAGEMENT/////////////////

router.get(
  "/enrolled",
  authenticateToken,
  isStudent,
  studentEnrollmentController.getAllEnrolledCourses.bind(
    studentEnrollmentController
  )
);

router.get(
  "/enrolled/:courseId",
  authenticateToken,
  isStudent,
  studentEnrollmentController.getEnrollmentCourseDetails.bind(
    studentEnrollmentController
  )
);

router.patch(
  "/enrolled/completeChapter",
  authenticateToken,
  isStudent,
  studentEnrollmentController.completeChapter.bind(studentEnrollmentController)
);

router.post(
  "/submitQuiz",
  authenticateToken,
  isStudent,
  studentEnrollmentController.submitQuizResult.bind(studentEnrollmentController)
);

router.get(
  "/enrollment/:courseId/allChaptersComplete",
  authenticateToken,
  isStudent,
  studentEnrollmentController.checkAllChaptersCompleted.bind(
    studentEnrollmentController
  )
);

router.get(
  "/certificate/:courseId",
  authenticateToken,
  isStudent,
  studentEnrollmentController.getCertificateUrl.bind(
    studentEnrollmentController
  )
);

//wallet related routes

router.get(
  "/wallet",
  authenticateToken,
  isStudent,
  studentWalletController.getWallet.bind(studentWalletController)
);

router.post(
  "/wallet/credit",
  authenticateToken,
  isStudent,
  studentWalletController.creditWallet.bind(studentWalletController)
);

router.post(
  "/wallet/debit",
  authenticateToken,
  isStudent,
  studentWalletController.debitWallet.bind(studentWalletController)
);

router.get(
  "/wallet/transactions",
  authenticateToken,
  isStudent,
  studentWalletController.getPaginatedTransactions.bind(studentWalletController)
);

//wallet payment related routes

router.post(
  "/wallet/payment/createOrder",
  authenticateToken,
  isStudent,
  studentWalletPaymentController.createOrder.bind(
    studentWalletPaymentController
  )
);

router.post(
  "/wallet/payment/verify",
  authenticateToken,
  isStudent,
  studentWalletPaymentController.verifyPayment.bind(
    studentWalletPaymentController
  )
);

//////////////////////order history///////////////////////////////////

router.get(
  "/orders",
  authenticateToken,
  isStudent,
  studentOrderController.getOrderHistory.bind(studentOrderController)
);

router.get(
  "/orders/:orderId",
  authenticateToken,
  isStudent,
  studentOrderController.getOrderDetails.bind(studentOrderController)
);

router.get(
  "/orders/:orderId/invoice",
  authenticateToken,
  isStudent,
  studentOrderController.downloadInvoice.bind(studentOrderController)
);

//student side instructor Listing

router.get(
  "/instructors",
  studentInstructorListingController.listMentors.bind(
    studentInstructorListingController
  )
);

router.get(
  "/instructors/filters",
  studentInstructorListingController.getAvailableFilters.bind(
    studentInstructorListingController
  )
);

router.get(
  "/instructors/:instructorId",
  studentInstructorListingController.getMentorById.bind(
    studentInstructorListingController
  )
);

router.get(
  "/slots/:instructorId",
  studentSlotController.getAvailableSlots.bind(studentSlotController)
);

///////////////slot booking related routes/////////////////

router.post(
  "/checkout/:slotId",
  authenticateToken,
  isStudent,
  studentSlotBookingController.initiateCheckout.bind(
    studentSlotBookingController
  )
);

router.post(
  "/verifySlotPayment",
  authenticateToken,
  isStudent,
  studentSlotBookingController.verifyPayment.bind(studentSlotBookingController)
);

router.post(
  "/wallet/:slotId",
  authenticateToken,
  isStudent,
  studentSlotBookingController.bookViaWallet.bind(studentSlotBookingController)
);

router.get(
  "/bookingHistory",
  authenticateToken,
  isStudent,
  studentSlotBookingController.getBookingHistory.bind(
    studentSlotBookingController
  )
);

router.get(
  "/booking/:bookingId",
  authenticateToken,
  isStudent,
  studentSlotBookingController.getBookingDetail.bind(
    studentSlotBookingController
  )
);

router.get(
  "/booking/:bookingId/receipt",
  authenticateToken,
  isStudent,
  studentSlotBookingController.downloadReceipt.bind(
    studentSlotBookingController
  )
);

export default router;
