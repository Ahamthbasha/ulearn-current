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

};

export default AdminRoutersEndPoints;
