const InstructorRouterEndPoints = {
    instructorSendVerificationRequest :'/api/instructor/verificationRequest',
    instructorGetVerificationStatus : '/api/instructor/getVerificationByEmail',

    //profile management endpoints
    instructorProfilePage :'/api/instructor/profile',
    instructorUpdateProfile : '/api/instructor/profile',
    instructorUpdatePassword : '/api/instructor/profile/password',

    //category fetch
    instructorGetCategory : '/api/instructor/categories',

    //instructor created course fetch
    instructorGetCreatedCourses: '/api/instructor/courses',

    //course management
    instructorCreateCourse : '/api/instructor/course',
    instructorUpdateCourse : '/api/instructor/course',
    instructorDeleteCourse : '/api/instructor/course',
    instructorGetCourseById :  '/api/instructor/course',
    //publish course

    instructorPublishCourseById : '/api/instructor/course',

    //Chapter Management
    instructorGetChaptersByCourse: "/api/instructor/chapters",            
    instructorCreateChapter: "/api/instructor/chapters",                     
    instructorUpdateChapter: "/api/instructor/chapters",                    
    instructorDeleteChapter: "/api/instructor/chapters",    
    instructorGetSingleChapter: "/api/instructor/chapters", 

  //instructor quiz routes

  instructorCreateQuiz : "/api/instructor/quiz",
  instructorDeleteQuiz : "/api/instructor/quiz",
  instructorGetQuizById : "/api/instructor/quiz",
  instructorGetQuizByCourseId : "/api/instructor/quiz/course",

  instructorAddQuestion: "/api/instructor/quiz",
  instructorUpdateQuestion: "/api/instructor/quiz",
  instructorDeleteQuestion: "/api/instructor/quiz",


  //instructorDashboard

  instructorGetDashboard : '/api/instructor/dashboard',
  instructorGetDashboardReport : '/api/instructor/dashboard/report',
  instructorReportExport : '/api/instructor/dashboard/reportRevenueExport',

  //specific course dashboard

  instructorSpecificCourse : '/api/instructor/dashboard/specificCourse',
  instructorSpecificCourseReport : '/api/instructor/dashboard/specificCourse',
  instructorExportSpecificCourseReport : '/api/instructor/dashboard/specificCourse',
  
 //wallet
  instructorGetWallet : "/api/instructor/wallet",
  instructorCreditWallet : "/api/instructor/wallet/credit",
  instructorDebitWallet : "/api/instructor/wallet/debit",
  instructorGetTransactions : '/api/instructor/wallet/transactions',
  instructorCreateOrderForWalletCredit : "/api/instructor/wallet/payment/createOrder",
  instructorVerifyPayment : "/api/instructor/wallet/payment/verify",

  //membership

  instructorViewMembership : "/api/instructor/membershipPlans",
  instructorMentorOrNot : "/api/instructor/isMentor",
  instructorCheckActiveMembership : "/api/instructor/membership/active",

  //purchase membership

  instructorInitiateCheckout : "/api/instructor/checkout",
  instructorVerifyMembership : "/api/instructor/verify",
  instructorPurcahseMembershipWithWallet : "/api/instructor/membership/purchaseWallet",

  //purchase history

  instructorMembershipPurchaseHistory : "/api/instructor/membershipOrders",
  instructorMembershipDetails : "/api/instructor/membershipOrder",
  instructorDownloadReceiptForMembership : "/api/instructor/membershipOrder",

  //slot

  instructorCreateSlot : "/api/instructor/createSlot",
  instructorListSlots : "/api/instructor/slots",
  instructorUpdateSlot : "/api/instructor/slot",
  instructorDeleteSlot : "/api/instructor/slot",
  instructorSlotHistory: "/api/instructor/slotStats",

  //slot details

  instructorSlotDetail : "/api/instructor/slotBooking",
}

export default InstructorRouterEndPoints