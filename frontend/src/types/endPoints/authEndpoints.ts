const authenticationRoutes = {

    //studentRoutes
    studentSignUp : "/api/student/signUp",
    studentResendOtp:"/api/student/resendOtp",
    studentVerifyOtp:"/api/student/createUser",
    studentLogin:"/api/student/login",
    studentLogout:"/api/student/logout",
    studentVerifyEmail:"/api/student/verifyEmail",
    studentVerifyResetOtp:"/api/student/verifyResetOtp",
    studentForgotResendOtp:"/api/student/forgotResendOtp",
    studentResetPassword:"/api/student/resetPassword",
    studentGoogleLogin:'/api/student/googleLogin',
    

    //instructorRoutes

    instructorSignUp:"/api/instructor/signUp",
    instructorResendOtp:"/api/instructor/resendOtp",
    instructorVerifyOtp:"/api/instructor/createUser",
    instructorLogin:"/api/instructor/login",
    instructorLogout:"/api/instructor/logout",
    instructorVerifyEmail:'/api/instructor/verifyEmail',
    instructorVerifyResetOtp:"/api/instructor/verifyResetOtp",
    instructorForgotResendOtp:"/api/instructor/forgotResendOtp",
    instructorResetPassword:"/api/instructor/resetPassword",
    instructorGoogleLogin:"/api/instructor/googleLogin",

    //adminRoutes

    adminLogin:"/api/admin/login",
    adminLogout:"/api/admin/logout"

}

export default authenticationRoutes