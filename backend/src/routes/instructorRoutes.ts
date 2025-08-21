import { Router } from "express";
import {
  instructorController,
  instructorVerificationController,
  instructorProfileController,
  instructorCategoryController,
  instructorCourseController,
  instructorChapterController,
  instructorQuizController,
  instructorDashboardController,
  specificCourseDashboardController,
  instructorWalletController,
  instructorWalletPaymentController,
  instructorMembershipController,
  instructorMembershipOrderController,
  instructorSlotController,
  instructorSlotBookingController,
  instructorWithdrawalController,
} from "../config/dependencyInjector";
import upload from "../utils/multer";

import authenticateToken from "../middlewares/authenticatedRoutes";
import { isInstructor } from "../middlewares/roleAuth";

let router = Router();

router.post("/signUp", instructorController.signUp.bind(instructorController));

router.post(
  "/resendOtp",
  instructorController.resendOtp.bind(instructorController)
);

router.post(
  "/createUser",
  instructorController.createUser.bind(instructorController)
);

router.post("/login", instructorController.login.bind(instructorController));

router.post("/logout", instructorController.logout.bind(instructorController));

router.post(
  "/verifyEmail",
  instructorController.verifyEmail.bind(instructorController)
);

router.post(
  "/verifyResetOtp",
  instructorController.verifyResetOtp.bind(instructorController)
);

router.post(
  "/forgotResendOtp",
  instructorController.forgotResendOtp.bind(instructorController)
);

router.post(
  "/resetPassword",
  instructorController.resetPassword.bind(instructorController)
);

router.post(
  "/googleLogin",
  instructorController.doGoogleLogin.bind(instructorController)
);

//verification part
router.post(
  "/verificationRequest",
  upload.fields([
    { name: "degreeCertificate", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  instructorVerificationController.submitRequest.bind(
    instructorVerificationController
  )
);

router.get(
  "/getVerificationByEmail/:email",
  instructorVerificationController.getRequestByEmail.bind(
    instructorVerificationController
  )
);

//isBlocked check

router.get(
  "/statusCheck",
  authenticateToken,
  isInstructor,
  instructorController.statusCheck.bind(instructorController)
);

//profile management part

router.get(
  "/profile",
  authenticateToken,
  isInstructor,
  instructorProfileController.getProfile.bind(instructorProfileController)
);

router.put(
  "/profile",
  authenticateToken,
  isInstructor,
  upload.single("profilePic"),
  instructorProfileController.updateProfile.bind(instructorProfileController)
);

router.put(
  "/profile/password",
  authenticateToken,
  isInstructor,
  instructorProfileController.updatePassword.bind(instructorProfileController)
);

router.post(
  "/profile/updateBank",
  authenticateToken,
  isInstructor,
  instructorProfileController.updateBankAccount.bind(instructorProfileController)
)

//categoryfetch

router.get(
  "/categories",
  authenticateToken,
  isInstructor,
  instructorCategoryController.getListedCategories.bind(
    instructorCategoryController
  )
);

// Create Course
router.post(
  "/course",
  authenticateToken,
  isInstructor,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "demoVideos", maxCount: 1 },
  ]),
  instructorCourseController.createCourse.bind(instructorCourseController)
);

// Update Course
router.put(
  "/course/:courseId",
  authenticateToken,
  isInstructor,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "demoVideos", maxCount: 1 },
  ]),
  instructorCourseController.updateCourse.bind(instructorCourseController)
);

// Delete Course
router.delete(
  "/course/:courseId",
  authenticateToken,
  isInstructor,
  instructorCourseController.deleteCourse.bind(instructorCourseController)
);

// Get Course By ID
router.get(
  "/course/:courseId",
  authenticateToken,
  isInstructor,
  instructorCourseController.getCourseById.bind(instructorCourseController)
);

//instructor created courses visit

router.get(
  "/courses",
  authenticateToken,
  isInstructor,
  instructorCourseController.getInstructorCourses.bind(
    instructorCourseController
  )
);

//publish course

router.patch(
  "/course/:courseId/publish",
  authenticateToken,
  isInstructor,
  instructorCourseController.publishCourse.bind(instructorCourseController)
);

//chapter routes

router.get(
  "/chapters/:courseId",
  authenticateToken,
  isInstructor,
  instructorChapterController.getChaptersByCourse.bind(
    instructorChapterController
  )
);

router.post(
  "/chapters/:courseId",
  authenticateToken,
  isInstructor,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "captions", maxCount: 1 },
  ]),
  instructorChapterController.createChapter.bind(instructorChapterController)
);

router.put(
  "/chapters/:courseId/:chapterId",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "captions", maxCount: 1 },
  ]),
  instructorChapterController.updateChapter.bind(instructorChapterController)
);

router.delete(
  "/chapters/:courseId/:chapterId",
  authenticateToken,
  isInstructor,
  instructorChapterController.deleteChapter.bind(instructorChapterController)
);

router.get(
  "/chapters/:courseId/:chapterId",
  authenticateToken,
  isInstructor,
  instructorChapterController.getChapterById.bind(instructorChapterController)
);

//quiz routes

router.post(
  "/quiz",
  authenticateToken,
  isInstructor,
  instructorQuizController.createQuiz.bind(instructorQuizController)
);

router.delete(
  "/quiz/:quizId",
  instructorQuizController.deleteQuiz.bind(instructorQuizController)
);

router.get(
  "/quiz/:quizId",
  authenticateToken,
  isInstructor,
  instructorQuizController.getQuizById.bind(instructorQuizController)
);

router.get(
  "/quiz/course/:courseId",
  authenticateToken,
  isInstructor,
  instructorQuizController.getQuizByCourseId.bind(instructorQuizController)
);

//questions-level routes inside a quiz

router.post(
  "/quiz/:courseId/question",
  authenticateToken,
  isInstructor,
  instructorQuizController.addQuestion.bind(instructorQuizController)
);

router.put(
  "/quiz/:quizId/question/:questionId",
  authenticateToken,
  isInstructor,
  instructorQuizController.updateQuestion.bind(instructorQuizController)
);

router.delete(
  "/quiz/:quizId/question/:questionId",
  authenticateToken,
  isInstructor,
  instructorQuizController.deleteQuestion.bind(instructorQuizController)
);

router.get(
  "/quiz/course/:courseId/paginated",
  authenticateToken,
  isInstructor,
  instructorQuizController.getPaginatedQuestionsByCourseId.bind(
    instructorQuizController
  )
);

/////////////////////////instructor dashboard///////////////////////////////////

router.get(
  "/dashboard",
  authenticateToken,
  isInstructor,
  instructorDashboardController.getDashboard.bind(instructorDashboardController)
);

router.get(
  "/dashboard/report",
  authenticateToken,
  isInstructor,
  instructorDashboardController.getDetailedRevenueReport.bind(
    instructorDashboardController
  )
);

router.get(
  "/dashboard/reportRevenueExport",
  authenticateToken,
  isInstructor,
  instructorDashboardController.exportRevenueReport.bind(
    instructorDashboardController
  )
);

////////////instructor specific course dashboard///////////////////////////

router.get(
  "/dashboard/specificCourse/:courseId",
  authenticateToken,
  isInstructor,
  specificCourseDashboardController.getCourseDashboard.bind(
    specificCourseDashboardController
  )
);

router.get(
  "/dashboard/specificCourse/:courseId/revenueReport",
  authenticateToken,
  isInstructor,
  specificCourseDashboardController.getCourseRevenueReport.bind(
    specificCourseDashboardController
  )
);

router.get(
  "/dashboard/specificCourse/:courseId/exportRevenueReport",
  authenticateToken,
  isInstructor,
  specificCourseDashboardController.exportCourseRevenueReport.bind(
    specificCourseDashboardController
  )
);

//wallet related routes

router.get(
  "/wallet",
  authenticateToken,
  isInstructor,
  instructorWalletController.getWallet.bind(instructorWalletController)
);

router.post(
  "/wallet/credit",
  authenticateToken,
  isInstructor,
  instructorWalletController.creditWallet.bind(instructorWalletController)
);

router.post(
  "/wallet/debit",
  authenticateToken,
  isInstructor,
  instructorWalletController.debitWallet.bind(instructorWalletController)
);

router.get(
  "/wallet/transactions",
  authenticateToken,
  isInstructor,
  instructorWalletController.getPaginatedTransactions.bind(
    instructorWalletController
  )
);

//wallet payment related routes

router.post(
  "/wallet/payment/createOrder",
  authenticateToken,
  isInstructor,
  instructorWalletPaymentController.createOrder.bind(
    instructorWalletPaymentController
  )
);

router.post(
  "/wallet/payment/verify",
  authenticateToken,
  isInstructor,
  instructorWalletPaymentController.verifyPayment.bind(
    instructorWalletPaymentController
  )
);

//////// Instructor withdrawal Request /////////////////

router.post(
  "/withdrawalRequest",
  authenticateToken,
  isInstructor,
  instructorWithdrawalController.createWithdrawalRequest.bind(
    instructorWithdrawalController
  )
);

router.get(
  "/withdrawalRequests",
  authenticateToken,
  isInstructor,
  instructorWithdrawalController.getWithdrawalRequestsWithPagination.bind(
    instructorWithdrawalController
  )
);

router.patch(
  "/withdrawalRequest/:requestId/retry",
  isInstructor,
  instructorWithdrawalController.retryWithdrawalRequest.bind(
    instructorWithdrawalController
  )
);

///////instructor membership////////////////////////////

router.get(
  "/membershipPlans",
  authenticateToken,
  isInstructor,
  instructorMembershipController.getPlans.bind(instructorMembershipController)
);

router.get(
  "/isMentor",
  authenticateToken,
  isInstructor,
  instructorMembershipController.getStatus.bind(instructorMembershipController)
);

router.get(
  "/membership/active",
  authenticateToken,
  isInstructor,
  instructorMembershipController.getActiveMembership.bind(
    instructorMembershipController
  )
);

//purchase membership

router.post(
  "/checkout/:planId",
  authenticateToken,
  isInstructor,
  instructorMembershipOrderController.initiateCheckout.bind(
    instructorMembershipOrderController
  )
);

router.post(
  "/verify",
  authenticateToken,
  isInstructor,
  isInstructor,
  instructorMembershipOrderController.verifyOrder.bind(
    instructorMembershipOrderController
  )
);

router.post(
  "/membership/purchaseWallet/:planId",
  authenticateToken,
  isInstructor,
  instructorMembershipOrderController.purchaseWithWallet.bind(
    instructorMembershipOrderController
  )
);

router.get(
  "/membershipOrders",
  authenticateToken,
  isInstructor,
  instructorMembershipOrderController.getInstructorOrders.bind(
    instructorMembershipOrderController
  )
);

router.get(
  "/membershipOrder/:txnId",
  authenticateToken,
  isInstructor,
  instructorMembershipOrderController.getMembershipOrderDetail.bind(
    instructorMembershipOrderController
  )
);

router.get(
  "/membershipOrder/:txnId/receipt",
  authenticateToken,
  isInstructor,
  instructorMembershipOrderController.downloadReceipt.bind(
    instructorMembershipOrderController
  )
);

//slot

router.post(
  "/createSlot",
  authenticateToken,
  isInstructor,
  instructorSlotController.createSlot.bind(instructorSlotController)
);

router.get(
  "/slots",
  authenticateToken,
  isInstructor,
  instructorSlotController.listSlots.bind(instructorSlotController)
);

router.put(
  "/slot/:slotId",
  authenticateToken,
  isInstructor,
  instructorSlotController.updateSlot.bind(instructorSlotController)
);

router.delete(
  "/slot/:slotId",
  authenticateToken,
  isInstructor,
  instructorSlotController.deleteSlot.bind(instructorSlotController)
);

router.get(
  "/slotStats",
  authenticateToken,
  isInstructor,
  instructorSlotController.getSlotStatsByMonth.bind(instructorSlotController)
);

//slot detail

router.get(
  "/slotBooking/:slotId",
  authenticateToken,
  isInstructor,
  instructorSlotBookingController.getBookingDetail.bind(
    instructorSlotBookingController
  )
);

const instructorRoutes = router;

export default instructorRoutes;
