const AdminRoutersEndPoints = {
  //user block or unblock
  adminGetUsers: "/api/admin/getAllUsers",
  adminBlockUser: "/api/admin/blockUser",
  //instructor block or unblock
  adminGetInstructors: "/api/admin/getAllInstructors",
  adminBlockInstructor: "/api/admin/blockInstructor",
  //verification
  adminGetVerifcationsRequest: "/api/admin/requests",
  adminGetVerificationByEamil: "/api/admin/request",
  adminApproveVerification: "/api/admin/approveRequest",
  //category
  adminGetAllCategories: "/api/admin/categories",
  adminGetCategoryById: "/api/admin/category",
  adminListOrUnListCategory: "/api/admin/categoryListOrUnList",
  adminCreateCategory: "/api/admin/category",
  adminEditCategory: "/api/admin/category",

  //course
  adminGetCourses: "/api/admin/courses",
  adminGetCourseDetail : "/api/admin/courses",
  adminToggleList: "/api/admin/courses",
  adminVerifyCourse: "/api/admin/courses",

  //wallet
  adminGetWallet: "/api/admin/wallet",
  adminCreditWallet: "/api/admin/wallet/credit",
  adminDebitWallet: "/api/admin/wallet/debit",
  adminWalletTransactions: "/api/admin/wallet/transactions",
  
  //wallet payment
  adminCreateOrderForWalletCredit: "/api/admin/wallet/payment/createOrder",
  adminVerifyPayment: "/api/admin/wallet/payment/verify",

  //withdrawal
  adminGetAllWithdrawalRequests : "/api/admin/allWithdrawalRequests",
  adminWithdrawalPending : "/api/admin/withdrawalRequestPending",
  adminWithdrawalApprove : "/api/admin/withdrawalRequestApprove",
  adminWithdrawalReject : "/api/admin/withdrawalRequestReject",
  adminGetRequestDetails : "/api/admin/withdrawalRequest",
  //membership

  adminAddMembershipPlan : '/api/admin/membershipPlan',
  adminEditMembershipPlan : '/api/admin/membershipPlan',
  adminDeleteMembershipPlan : '/api/admin/membershipPlan',
  adminGetMembershipPlanById : '/api/admin/membershipPlan',
  adminGetAllMembeshipPlan : '/api/admin/membershipPlans',
  adminToggleMembershipPlan : '/api/admin/membershipPlan',

  //membership purchase history

  adminGetMembershipPurchaseHistory : "/api/admin/membershipPurchaseHistory",
  adminViewMembershipPuchaseHistoryDetail : "/api/admin/membershipPurchaseHistory",

  //admin dashbaord

  adminDashboard : "/api/admin/dashboard",
  adminCourseReport : "/api/admin/dashboard/courseSalesReport",
  adminMembershipReport : "/api/admin/dashboard/membershipSalesReport",
  adminExportReport : "/api/admin/dashboard/exportCourseReport",
  adminExportMembershipReport : "/api/admin/dashboard/exportMembershipReport",

  //adminCoupon

  adminCreateCoupon : "/api/admin/coupons",
  adminGetCoupons : "/api/admin/coupons",
  adminGetSpecificCoupon : "/api/admin/coupons",
  adminEditCoupon : "/api/admin/coupons",
  adminDeleteCoupon : "/api/admin/coupons",
  adminGetCouponByCode : "/api/admin/couponCode",
  adminModifyStatus : "/api/admin/coupons",

  //adminCourseOffer
  adminGetAllCourseOfferRequest : "/api/admin/courseOffers",
  adminVerifyCourseOffer : "/api/admin/courseOffers/verify",
  adminGetCourseOfferDetail : "/api/admin/courseOffer",


  //admin Category Offer

  adminGetCategories: "/api/admin/getCategories",
  adminGetCategoryOffers: "/api/admin/getCategoryOffers",
  adminGetCategoryOfferById: "/api/admin/categoryOffers",
  adminCreateCategoryOffer: "/api/admin/createCategoryOffer",
  adminUpdateCategoryOffer: "/api/admin/updateCategoryOffer",
  adminToggleCategoryOffer: "/api/admin/toggleCategoryOffer",
  adminDeleteCategoryOffer: "/api/admin/deleteCategoryOffer",

  //adminLearningPath verification

  adminGetLearningPaths: "/api/admin/learningPaths",
  adminGetLearningPathById: "/api/admin/learningPaths",
  adminVerifyLearningPath: "/api/admin/learningPaths",

  //adminReview management

  adminGetAllReviews:"/api/admin/reviews",
  adminDeleteReview:"/api/admin/reviews",
  adminUnDeleteReview:"/api/admin/reviews",
  adminRejectReview:"/api/admin/reviews",
  adminApproveReview: "/api/admin/reviews",
  adminGetSpecificReview:"/api/admin/reviews",


};

export default AdminRoutersEndPoints;
