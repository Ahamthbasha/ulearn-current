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
  instructorCourseOfferController,
  instructorModuleController,
} from "../config/dependencyInjector";
import upload from "../utils/multer";

import authenticateToken from "../middlewares/authenticatedRoutes";
import { isInstructor } from "../middlewares/roleAuth";
import { restrictBlockedUser } from "../middlewares/blockCheck";

let router = Router();

router.post("/signUp", instructorController.signUp.bind(instructorController));

router.post(
  "/resendOtp",
  instructorController.resendOtp.bind(instructorController),
);

router.post(
  "/createUser",
  instructorController.createUser.bind(instructorController),
);

router.post("/login", instructorController.login.bind(instructorController));

router.post("/logout", instructorController.logout.bind(instructorController));

router.post(
  "/verifyEmail",
  instructorController.verifyEmail.bind(instructorController),
);

router.post(
  "/verifyResetOtp",
  instructorController.verifyResetOtp.bind(instructorController),
);

router.post(
  "/forgotResendOtp",
  instructorController.forgotResendOtp.bind(instructorController),
);

router.post(
  "/resetPassword",
  instructorController.resetPassword.bind(instructorController),
);

router.post(
  "/googleLogin",
  instructorController.doGoogleLogin.bind(instructorController),
);

//verification part
router.post(
  "/verificationRequest",
  upload.fields([
    { name: "degreeCertificate", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  instructorVerificationController.submitRequest.bind(
    instructorVerificationController,
  ),
);

router.get(
  "/getVerificationByEmail/:email",
  instructorVerificationController.getRequestByEmail.bind(
    instructorVerificationController,
  ),
);

//profile management part

router.get(
  "/profile",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorProfileController.getProfile.bind(instructorProfileController),
);

router.put(
  "/profile",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  upload.single("profilePic"),
  instructorProfileController.updateProfile.bind(instructorProfileController),
);

router.put(
  "/profile/password",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorProfileController.updatePassword.bind(instructorProfileController),
);

router.post(
  "/profile/updateBank",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorProfileController.updateBankAccount.bind(
    instructorProfileController,
  ),
);

//categoryfetch

router.get(
  "/categories",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCategoryController.getListedCategories.bind(
    instructorCategoryController,
  ),
);

// Create Course
router.post(
  "/course",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "demoVideos", maxCount: 1 },
  ]),
  instructorCourseController.createCourse.bind(instructorCourseController),
);

// Update Course
router.put(
  "/course/:courseId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "demoVideos", maxCount: 1 },
  ]),
  instructorCourseController.updateCourse.bind(instructorCourseController),
);

// Delete Course
router.delete(
  "/course/:courseId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseController.deleteCourse.bind(instructorCourseController),
);

// Get Course By ID
router.get(
  "/course/:courseId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseController.getCourseById.bind(instructorCourseController),
);

//instructor created courses visit

router.get(
  "/courses",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseController.getInstructorCourses.bind(
    instructorCourseController,
  ),
);

router.get(
  "/getVerifiedCourses",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseController.getVerifiedInstructorCourses.bind(
    instructorCourseController,
  ),
);

//publish course

router.patch(
  "/course/:courseId/publish",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseController.publishCourse.bind(instructorCourseController),
);

router.patch(
  "/course/:courseId/submit",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseController.submitCourseForVerification.bind(
    instructorCourseController,
  ),
);

//modules routes

// Get Modules by Course (with pagination & search)
router.get(
  "/course/:courseId/modules",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorModuleController.getModulesByCourse.bind(
    instructorModuleController,
  ),
);

// Create Module
router.post(
  "/modules",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorModuleController.createModule.bind(instructorModuleController),
);

// Get Module by ID
router.get(
  "/modules/:moduleId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorModuleController.getModuleById.bind(instructorModuleController),
);

// Update Module
router.put(
  "/modules/:moduleId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorModuleController.updateModule.bind(instructorModuleController),
);

// Delete Module
router.delete(
  "/modules/:moduleId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorModuleController.deleteModule.bind(instructorModuleController),
);

// ============================================
// CHAPTER ROUTES (UPDATED - now scoped to modules)
// ============================================

// Get Chapters by Module (with pagination & search)
router.get(
  "/modules/:moduleId/chapters",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorChapterController.getChaptersByModule.bind(
    instructorChapterController,
  ),
);

// Create Chapter (in a module)
router.post(
  "/chapters",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "captions", maxCount: 1 },
  ]),
  instructorChapterController.createChapter.bind(instructorChapterController),
);

// Get Chapter by ID
router.get(
  "/chapters/:chapterId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorChapterController.getChapterById.bind(instructorChapterController),
);

// Update Chapter
router.put(
  "/chapters/:chapterId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "captions", maxCount: 1 },
  ]),
  instructorChapterController.updateChapter.bind(instructorChapterController),
);

// Delete Chapter
router.delete(
  "/chapters/:chapterId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorChapterController.deleteChapter.bind(instructorChapterController),
);

// //chapter routes

// router.get(
//   "/chapters/:courseId",
//   authenticateToken,
//   restrictBlockedUser,
//   isInstructor,
//   instructorChapterController.getChaptersByCourse.bind(
//     instructorChapterController,
//   ),
// );



// router.post(
//   "/chapters/:courseId",
//   authenticateToken,
//   restrictBlockedUser,
//   isInstructor,
//   upload.fields([
//     { name: "video", maxCount: 1 },
//     { name: "captions", maxCount: 1 },
//   ]),
//   instructorChapterController.createChapter.bind(instructorChapterController),
// );

// router.put(
//   "/chapters/:courseId/:chapterId",
//   authenticateToken,
//   restrictBlockedUser,
//   isInstructor,
//   upload.fields([
//     { name: "video", maxCount: 1 },
//     { name: "captions", maxCount: 1 },
//   ]),
//   instructorChapterController.updateChapter.bind(instructorChapterController),
// );

// router.delete(
//   "/chapters/:courseId/:chapterId",
//   authenticateToken,
//   restrictBlockedUser,
//   isInstructor,
//   instructorChapterController.deleteChapter.bind(instructorChapterController),
// );

// router.get(
//   "/chapters/:courseId/:chapterId",
//   authenticateToken,
//   restrictBlockedUser,
//   isInstructor,
//   instructorChapterController.getChapterById.bind(instructorChapterController),
// );

//quiz routes

router.post(
  "/quiz",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorQuizController.createQuiz.bind(instructorQuizController),
);

router.delete(
  "/quiz/:quizId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorQuizController.deleteQuiz.bind(instructorQuizController),
);

router.get(
  "/quiz/:quizId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorQuizController.getQuizById.bind(instructorQuizController),
);

router.get(
  "/quiz/course/:courseId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorQuizController.getQuizByCourseId.bind(instructorQuizController),
);

//questions-level routes inside a quiz

router.post(
  "/quiz/:courseId/question",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorQuizController.addQuestion.bind(instructorQuizController),
);

router.put(
  "/quiz/:quizId/question/:questionId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorQuizController.updateQuestion.bind(instructorQuizController),
);

router.delete(
  "/quiz/:quizId/question/:questionId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorQuizController.deleteQuestion.bind(instructorQuizController),
);

router.get(
  "/quiz/course/:courseId/paginated",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorQuizController.getPaginatedQuestionsByCourseId.bind(
    instructorQuizController,
  ),
);

/////////////////////////instructor dashboard///////////////////////////////////

router.get(
  "/dashboard",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorDashboardController.getDashboard.bind(
    instructorDashboardController,
  ),
);

router.get(
  "/dashboard/report",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorDashboardController.getDetailedRevenueReport.bind(
    instructorDashboardController,
  ),
);

router.get(
  "/dashboard/reportRevenueExport",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorDashboardController.exportRevenueReport.bind(
    instructorDashboardController,
  ),
);

////////////instructor specific course dashboard///////////////////////////

router.get(
  "/dashboard/specificCourse/:courseId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  specificCourseDashboardController.getCourseDashboard.bind(
    specificCourseDashboardController,
  ),
);

router.get(
  "/dashboard/specificCourse/:courseId/revenueReport",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  specificCourseDashboardController.getCourseRevenueReport.bind(
    specificCourseDashboardController,
  ),
);

router.get(
  "/dashboard/specificCourse/:courseId/exportRevenueReport",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  specificCourseDashboardController.exportCourseRevenueReport.bind(
    specificCourseDashboardController,
  ),
);

//wallet related routes

router.get(
  "/wallet",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWalletController.getWallet.bind(instructorWalletController),
);

router.post(
  "/wallet/credit",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWalletController.creditWallet.bind(instructorWalletController),
);

router.post(
  "/wallet/debit",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWalletController.debitWallet.bind(instructorWalletController),
);

router.get(
  "/wallet/transactions",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWalletController.getPaginatedTransactions.bind(
    instructorWalletController,
  ),
);

//wallet payment related routes

router.post(
  "/wallet/payment/createOrder",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWalletPaymentController.createOrder.bind(
    instructorWalletPaymentController,
  ),
);

router.post(
  "/wallet/payment/verify",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWalletPaymentController.verifyPayment.bind(
    instructorWalletPaymentController,
  ),
);

//////// Instructor withdrawal Request /////////////////

router.post(
  "/withdrawalRequest",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWithdrawalController.createWithdrawalRequest.bind(
    instructorWithdrawalController,
  ),
);

router.get(
  "/withdrawalRequests",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWithdrawalController.getWithdrawalRequestsWithPagination.bind(
    instructorWithdrawalController,
  ),
);

router.patch(
  "/withdrawalRequest/:requestId/retry",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorWithdrawalController.retryWithdrawalRequest.bind(
    instructorWithdrawalController,
  ),
);

///////instructor membership////////////////////////////

router.get(
  "/membershipPlans",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipController.getPlans.bind(instructorMembershipController),
);

router.get(
  "/isMentor",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipController.getStatus.bind(instructorMembershipController),
);

router.get(
  "/membership/active",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipController.getActiveMembership.bind(
    instructorMembershipController,
  ),
);

//purchase membership

router.post(
  "/checkout/:planId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.initiateCheckout.bind(
    instructorMembershipOrderController,
  ),
);

router.post(
  "/verify",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.verifyOrder.bind(
    instructorMembershipOrderController,
  ),
);

router.post(
  "/createRazorpayOrder",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.createRazorpayOrder.bind(
    instructorMembershipOrderController,
  ),
);

router.post(
  "/retryOrder/:orderId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.retryFailedOrder.bind(
    instructorMembershipOrderController,
  ),
);

router.post(
  "/cancelOrder",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.cancelOrder.bind(
    instructorMembershipOrderController,
  ),
);

router.post(
  "/membership/purchaseWallet/:planId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.purchaseWithWallet.bind(
    instructorMembershipOrderController,
  ),
);

router.get(
  "/membershipOrders",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.getInstructorOrders.bind(
    instructorMembershipOrderController,
  ),
);

router.get(
  "/membershipOrder/:orderId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.getMembershipOrderDetail.bind(
    instructorMembershipOrderController,
  ),
);

router.get(
  "/membershipOrder/:orderId/receipt",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.downloadReceipt.bind(
    instructorMembershipOrderController,
  ),
);

router.post(
  "/markOrderAsFailed",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorMembershipOrderController.markOrderAsFailed.bind(
    instructorMembershipOrderController,
  ),
);

//slot

router.post(
  "/createSlot",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorSlotController.createSlot.bind(instructorSlotController),
);

router.get(
  "/slots",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorSlotController.listSlots.bind(instructorSlotController),
);

router.put(
  "/slot/:slotId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorSlotController.updateSlot.bind(instructorSlotController),
);

router.delete(
  "/slot/:slotId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorSlotController.deleteSlot.bind(instructorSlotController),
);

router.delete(
  "/slotDelete",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorSlotController.deleteUnbookedSlotsForDate.bind(
    instructorSlotController,
  ),
);

router.get(
  "/slotStats",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorSlotController.getSlotStatsByMonth.bind(instructorSlotController),
);

//slot detail

router.get(
  "/slotBooking/:slotId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorSlotBookingController.getBookingDetail.bind(
    instructorSlotBookingController,
  ),
);

///instructor course offer management

router.post(
  "/createCourseOffer",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseOfferController.createCourseOffer.bind(
    instructorCourseOfferController,
  ),
);

router.put(
  "/editCourseOffer",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseOfferController.editCourseOffer.bind(
    instructorCourseOfferController,
  ),
);

router.post(
  "/resubmitOffer",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseOfferController.resubmitOffer.bind(
    instructorCourseOfferController,
  ),
);

router.get(
  "/myOffers",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseOfferController.getOffersByInstructor.bind(
    instructorCourseOfferController,
  ),
);

router.get(
  "/courseOffer/:offerId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseOfferController.getOfferById.bind(
    instructorCourseOfferController,
  ),
);

router.delete(
  "/courseOffer/:offerId",
  authenticateToken,
  restrictBlockedUser,
  isInstructor,
  instructorCourseOfferController.deleteOffer.bind(
    instructorCourseOfferController,
  ),
);

const instructorRoutes = router;

export default instructorRoutes;
