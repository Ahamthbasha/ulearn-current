const UserRouterEndpoints = {
    userProfilePage: '/api/student/profile',
    userUpdateProfile: '/api/student/profile',
    userUpdatePassWord: '/api/student/profile/password',

    //userCourseList

    userCourseList:'/api/student/courses',
    userCourseDetail:'/api/student/courses',
    userCourseFilter:'/api/student/courses/filter',

    //userCategories
    userGetAllCategories:'/api/student/categories',

    //userCart
    userGetCart: '/api/student/cart',
    userAddToCart: '/api/student/addToCart',
    userRemoveCourseFromCart: '/api/student/remove',
    userClearCart: '/api/student/clearCart',

    //userWishlist
    userGetWishlist : '/api/student/wishlist',
    userAddTowishlist : '/api/student/addToWishlist',
    userRemoveWishlist : '/api/student/removeWishlistCourse',
    userCheckCourseExistInWishlist : '/api/student/check',

    //checkout
    userInitiateCheckout : '/api/student/checkout',
    userCompleteCheckout : '/api/student/complete',

    //enroll
    userGetEnrolledCourses : '/api/student/enrolled',
    userGetSpecificEnrolledCourses :'/api/student/enrolled',
    userMarkChapterCompleted : '/api/student/enrolled/completeChapter',
    userSubmitQuiz : '/api/student/submitQuiz',
    userCheckAllChapterCompleted : '/api/student/enrollment',
    userGetCertificate:'/api/student/certificate',

    //wallet related route

    userGetWallet : "/api/student/wallet",
    userCreditWallet : "/api/student/wallet/credit",
    userDebitWallet : "/api/student/wallet/debit",
    userGetTransactions : '/api/student/wallet/transactions',

    userCreateOrderForWalletCredit : "/api/student/wallet/payment/createOrder",
    userVerifyPayment : "/api/student/wallet/payment/verify",

    //order related routes

    userGetOrders : '/api/student/orders',
    userGetOrderDetail : '/api/student/orders',
    userDownloadOrderInvoice : '/api/student/orders',
}

export default UserRouterEndpoints