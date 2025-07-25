const UserRouterEndpoints = {
  userProfilePage: "/api/student/profile",
  userUpdateProfile: "/api/student/profile",
  userUpdatePassWord: "/api/student/profile/password",

  //userCourseList

  userCourseList: "/api/student/courses",
  userCourseDetail: "/api/student/courses",
  userCourseFilter: "/api/student/courses/filter",

  //userCategories
  userGetAllCategories: "/api/student/categories",

  //userCart
  userGetCart: "/api/student/cart",
  userAddToCart: "/api/student/addToCart",
  userRemoveCourseFromCart: "/api/student/remove",
  userClearCart: "/api/student/clearCart",

  //userWishlist
  userGetWishlist: "/api/student/wishlist",
  userAddTowishlist: "/api/student/addToWishlist",
  userRemoveWishlist: "/api/student/removeWishlistCourse",
  userCheckCourseExistInWishlist: "/api/student/check",

  //checkout
  userInitiateCheckout: "/api/student/checkout",
  userCompleteCheckout: "/api/student/complete",

  //enroll
  userGetEnrolledCourses: "/api/student/enrolled",
  userGetSpecificEnrolledCourses: "/api/student/enrolled",
  userMarkChapterCompleted: "/api/student/enrolled/completeChapter",
  userSubmitQuiz: "/api/student/submitQuiz",
  userCheckAllChapterCompleted: "/api/student/enrollment",
  userGetCertificate: "/api/student/certificate",

  //wallet related route

  userGetWallet: "/api/student/wallet",
  userCreditWallet: "/api/student/wallet/credit",
  userDebitWallet: "/api/student/wallet/debit",
  userGetTransactions: "/api/student/wallet/transactions",

  userCreateOrderForWalletCredit: "/api/student/wallet/payment/createOrder",
  userVerifyPayment: "/api/student/wallet/payment/verify",

  //order related routes

  userGetOrders: "/api/student/orders",
  userGetOrderDetail: "/api/student/orders",
  userDownloadOrderInvoice: "/api/student/orders",

  //student side instructor listing

  userSideInstructorLists: "/api/student/instructors",
  userSideInstructorDetailsById : "/api/student/instructors",
  userGetSkillsAndExpertise : "/api/student/instructors/filters",

  //viewing slots availability for the particular instructor

  userViewSlotsParticularInstructor : "/api/student/slots",

  //slot booking related routes

  userSlotInitiateCheckout : "/api/student/checkout",
  userSlotVerifyPayment : "/api/student/verifySlotPayment",
  userBookSlotViaWallet : "/api/student/wallet",
  userGetSlotBookingHistory : "/api/student/bookingHistory",
  userGetSpecificSlotDetail : "/api/student/booking",
  userDownloadSlotReceipt : "/api/student/booking",

  //student dashboard

  userDashboard : "/api/student/dashboard",
  userCourseReport : "/api/student/dashboard/courseReport",
  userSlotReport : "/api/student/dashboard/slotReport",
  userExportCourseReport : "/api/student/dashboard/exportCourseReport",
  userExportSlotReport : "/api/student/dashboard/exportSlotReport",

  

  
};

export default UserRouterEndpoints;
