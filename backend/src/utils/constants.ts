export const INSTRUCTOR_MESSAGES = {
  // General Messages
  EMAIL_PASSWORD_USERNAME_REQUIRED: "Email, password, and username are required",
  EMAIL_REQUIRED: "Email is required",
  OTP_REQUIRED: "OTP is required",
  NAME_EMAIL_REQUIRED: "Name and email are required",
  PASSWORD_REQUIRED: "Password is required",
  ACCESS_TOKEN_REQUIRED: "Access token is required",
  RESET_TOKEN_REQUIRED: "Reset token is required",

  // Success Messages
  SIGNUP_SUCCESS: "Signup successful",
  OTP_SENT: "OTP sent successfully",
  USER_CREATED: "User created successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REDIERCTING_OTP_PAGE: "Redirecting to OTP page",
  REDIERCTING_PASSWORD_RESET_PAGE: "Redirecting to password reset page",
  PASSWORD_RESET: "Password reset successful",
  GOOGLE_LOGIN_SUCCESS: "Google login successful",

  // Error Messages
  USER_ALREADY_EXISTS: "User already exists",
  FAILED_TO_CREATE_OTP: "Failed to create OTP",
  INCORRECT_OTP: "Incorrect OTP",
  INVALID_CREDENTIALS: "Invalid email or password",
  INSTRUCTOR_BLOCKED: "Instructor account is blocked",
  USER_NOT_FOUND: "User not found",
  TOKEN_INVALID: "Invalid or missing token",
  GOOGLE_LOGIN_FAILED: "Google login failed",
  FAILED_TO_RESET_PASSWORD: "Failed to reset password",
  WAIT_FOR_OTP: "Please wait {remainingTime} seconds before requesting a new OTP",
  INTERNAL_SERVER_ERROR: "Internal server error",
  BLOCK_CHECK: "Failed to check block status",
};




export const AdminErrorMessages = {
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_INCORRECT: "Incorrect email.",
  PASSWORD_INCORRECT: "Incorrect password.",
  ADMIN_CREATION_FAILED: "Failed to create admin account.",
  ADMIN_DATA_ERROR: "Error processing admin data.",
  INTERNAL_SERVER_ERROR: "Internal server error.",
  ADMINSIDE_COURSE_NOTFOUND: "Course not found",
  ADMIN_COURSE_UNLIST: "Course unlisted successfully",
  ADMIN_COURSE_NOTVERIFIED: "Course unverified and unlisted",
  ADMIN_CATEGORY_FETCHEDERROR: "Something went wrong while fetching categories",
  ADMIN_DASHBOARD_FILTER_ERROR: "Invalid type parameter",
  ADMIN_PAGENO_INVALID: "Invalid page number",
  ADMIN_PAGENOLIMIT_INVALID: "Invalid limit number",
  ADMIN_INVALID_FORMAT_PARAMETER: "Invalid format parameter",
  ADMIN_MEMBERSHIP_UPDATE_ERROR: "Failed to update membership plan status.",
  ADMIN_VERIFICATION_FETCH_ERROR:
    "Something went wrong while fetching verification requests",
  ADMIN_VERIFICATION_REQUEST_NOT_FOUND: "Verification request not found.",
  ADMIN_VERIFICATION_REJECTION: "Rejection reason is required.",
  ADMIN_INVALID_REQUEST_STATUS: "Invalid request status",
  ADMIN_FAILED_TO_FETCH_WALLET: "Failed to fetch wallet",
  ADMIN_FAILED_TO_CREDIT_WALLET: "Failed to credit wallet",
  ADMIN_INSUFFICIENT_BALANCE_WALLET_NOT_FOUND:
    "Insufficient balance or wallet not found",
  ADMIN_FAILED_TO_DEBIT_WALLET: "Failed to debit wallet",
  ADMIN_FAILED_TO_FETCH_TRANSACTIONS: "Failed to fetch transactions",
  ADMIN_FAILED_TO_ADD_RAZORPAY: "Failed to create Razorpay order",
  ADMIN_PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
  ADMIN_NOT_FOUND: "Admin ID not found",
  ADMIN_PAGENO_VALIDATION: "Page number must be greater than 0",
  ADMIN_LIMIT_VALIDATION: "Limit must be between 1 and 100",
  ADMIN_FAILED_FETCH_WITHDRAWAL_REQUEST: "Failed to fetch withdrawal requests",
  ADMIN_FAILED_TO_APPROVE_WITHDRAWAL: "Failed to approve withdrawal request",
  ADMIN_FAILED_TO_REJECT_WITHDRAWAL: "Failed to reject withdrawal request",
  ADMIN_INVALID_ID_FORMAT: "Invalid request ID format",
  ADMIN_WITHDRAWAL_REQUEST_NOTFOUND: "Withdrawal request not found",
  ADMIN_FAILED_TO_FETCH_WITHDRAWAL_REQUEST:
    "Failed to fetch withdrawal request",
};

export const AdminSuccessMessages = {
  ADMIN_APPROVE_WITHDRAWAL: "Withdrawal request approved successfully",
  ADMIN_REJECT_WITHDRAWAL: "Withdrawal request rejected successfully",
  LOGIN_SUCCESS: "Welcome Admin",
  LOGOUT_SUCCESS: "Logout successful.",
  ADMIN_CREATED: "Admin account created successfully.",
  ADMIN_DATA_RETRIEVED: "Admin data retrieved successfully.",
  ADMIN_COURSE_LISTED: "Course listed successfully",
  ADMIN_VERIFIED_COURSE: "Course verified and listed successfully",
  ADMIN_CATEGROY_FETCHED: "Categories fetched successfully",
  ADMIN_MEMBERSHIP_UPDATED: "Membership plan status updated successfully.",
  ADMIN_FETCHED_VERIFICATION_REQUEST:
    "Verification requests fetched successfully",
};

export const InstructorSuccessMessages = {
  //bank
  BANK_ACCOUNT_UPDATED: "bank account details updated successfully",
  // Auth & Signup
  SIGNUP_SUCCESS: "Signup successful, OTP sent to email.",
  OTP_SENT: "OTP has been sent to your email successfully!",
  USER_CREATED: "User created successfully!",
  LOGIN_SUCCESS: "User logged in successfully!",
  LOGOUT_SUCCESS: "Logout successful!",
  EMAIL_VERIFIED: "Email verified successfully!",
  TOKEN_VERIFIED: "Token verified successfully!",
  GOOGLE_LOGIN_SUCCESS: "Google login successful!",
  REDIERCTING_OTP_PAGE: "Rediercting To OTP Page",
  REDIERCTING_PASSWORD_RESET_PAGE: "Redirecting to Reset Password Page",

  // Account & Profile
  INSTRUCTOR_CREATED: "Instructor account created successfully.",
  PROFILE_FETCHED: "your information is retrieved",
  PROFILE_UPDATED: "Profile updated successfully.",
  PASSWORD_UPDATED: "Password updated successfully.",
  PASSWORD_RESET: "Password changed successfully!",
  PASSWORD_RESET_SUCCESS: "Password reset successfully.",

  // Data & Settings
  PLAN_PRICE_UPDATED: "Plan price updated successfully.",
  WALLET_UPDATED: "Wallet details updated successfully.",
  VERIFICATION_STATUS_UPDATED: "Verification status updated successfully.",
  INSTRUCTOR_BLOCKED: "Instructor blocked successfully.",
  INSTRUCTOR_UNBLOCKED: "Instructor unblocked successfully.",
  FILE_UPLOADED: "File uploaded successfully.",

  // Fetching Data
  TRANSACTIONS_FETCHED: "Transactions fetched successfully.",
  MENTORS_FETCHED: "Mentors fetched successfully.",
  MENTOR_EXPERTISE_FETCHED: "Mentor expertise fetched successfully.",
  PAGINATED_MENTORS_FETCHED: "Paginated mentors fetched successfully.",
  INSTRUCTOR_DATA_FETCHED: "Instructor data fetched successfully.",

  // Requests
  REQUEST_APPROVED: "Request approved successfully.",
  REQUEST_REJECTED: "Request rejected successfully.",
};

export const InstructorErrorMessages = {
  // Auth & Signup
  USER_ALREADY_EXISTS: "User already exists. Please log in instead.",
  USER_NOT_FOUND: "No user found with this email.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  INCORRECT_OTP: "Incorrect OTP.",
  EMAIL_VERIFICATION_FAILED: "Email verification failed.",
  TOKEN_INVALID: "Invalid or expired token.",
  TOKEN_EXPIRED: "Session expired. Please log in again.",
  PASSWORD_RESET_FAILED: "Password reset failed.",
  GOOGLE_LOGIN_FAILED: "Google login failed.",

  // Profile & Data
  INSTRUCTOR_NOT_FOUND: "Instructor not found.",
  INSTRUCTOR_ID_MISSING: "Instructor ID is required.",
  EMAIL_REQUIRED: "Email is required.",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect.",
  PROFILE_UPDATE_FAILED: "Failed to update profile. Please try again.",
  PLAN_PRICE_UPDATE_FAILED: "Failed to update plan price. Please try again.",
  WALLET_UPDATE_FAILED: "Failed to update wallet details.",
  VERIFICATION_FAILED: "Failed to update verification status.",
  BLOCK_FAILED: "Failed to block/unblock instructor.",
  FILE_UPLOAD_FAILED: "Failed to upload file. Please try again.",
  INVALID_DATA: "Invalid data provided. Please check your inputs.",

  // Data Fetch
  TRANSACTIONS_NOT_FOUND: "No transactions found for the instructor.",

  // Common
  INTERNAL_SERVER_ERROR:
    "An unexpected error occurred. Please try again later.",
  INSTRUCTOR_BLOCKED: "you are blocked by admin",
  UNAUTHORIZED: "you are not verified",

  PASSWORD_UPDATE_FAILED: "password updation failed",
  OTP_EXPIRED: "otp is expired.Request new One",
  OTP_NOT_FOUND: "otp is not found",

  //bank
  BANK_ACCOUNT_UPDATE_FAILED: "bank account updation failed",
};

export const StudentErrorMessages = {
  FAILED_TO_MARK_ORDER_AS_FAILED: "Failed to mark order as failed",
  CHECKOUT_FAILED: "Failed to initiate checkout",
  PAYMENT_FAILED: "Payment processing failed",
  FAILED_TO_FETCH_BOOKINGS: "Failed to fetch booking history",
  FAILED_TO_FETCH_BOOKING: "Failed to fetch booking details",
  SLOT_ALREADY_BOOKED: "Slot is already booked",
  PENDING_BOOKING_EXISTS: "A pending or confirmed booking already exists for this slot",
  PENDING_BOOKING_NOT_FOUND: "Pending booking not found",
  INSUFFICIENT_WALLET_BALANCE: "Insufficient wallet balance",

  USER_ALREADY_EXISTS: "User already exists. Please log in instead.",
  USER_NOT_FOUND: "No user found with this email.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  INCORRECT_OTP: "Incorrect OTP.",
  EMAIL_VERIFICATION_FAILED: "Email verification failed.",
  TOKEN_INVALID: "Invalid or expired token.",
  PASSWORD_RESET_FAILED: "Password reset failed.",
  GOOGLE_LOGIN_FAILED: "Google login failed.",
  INTERNAL_SERVER_ERROR: "Internal server error.",
  STUDENT_NOT_FOUND: "there is no user we find based on this email",
  PROFILE_UPDATE_FAILED: "profile updation failed",
  INTERNAL_ERROR: "Error related to server",
  PASSWORD_UPDATE_FAILED: "your password updation is failed",
  CURRENT_PASSWORD_INCORRECT: "your current password you entered is wrong",
  ACCESS_TOKEN_MISSING: "Access token missing",
  ACCOUNT_BLOCKED: "Your login has been declined. Your account is blocked.",
  OTP_EXPIRED: "OTP expired. Please request a new one.",
  NOT_FOUND_STUDENT: "Student not found",
  STATUS_CHECK_FAILED: "Status check failed",
  COURSE_FETCH_FAILED: "Failed to fetch courses",
  COURSE_DEATILFETCH_FAILED: "FAILED TO FETCH COURSE DETAILS",
  SERVER_ERROR: "internal server error",
  STUDENT_UNAUTHORIZED: "Unauthorized",
  STUDENT_ENROLLMENT_NOT_FOUND: "Enrollment not found",
  QUIZ_DATA_MISSING: "Missing quiz result data",
  FAILED_TO_SUBMIT_QUIZ_RESULT: "Failed to submit quiz result",
  FAILED_TO_CHECK_CHAPTER_COMPLETION: "Failed to check chapter completion",
  CERTIFICATE_NOT_AVAILABLE: "Certificate not available yet",
  FAILED_TO_FETCH_CERTIFICATE: "Failed to fetch certificate",
  FAILED_TO_LIST_INSTRUCTOR: "Failed to fetch instructors",
  INSTRUCTOR_NOT_FOUND: "Instructor not found",
  FAILED_TO_FETCH_INSTRUCTOR_DETAIL: "Failed to fetch instructor details",
  FAILED_TO_FETCH_FILTER_OPTION: "Failed to fetch filter options",
  FAILED_TO_FETCH_ORDER_HISTORY: "Failed to fetch order history",
  ORDER_NOT_FOUND: "Order not found",
  FAILED_TO_FETCH_ORDER_DETAILS: "Failed to fetch order details",
  FAILED_TO_DOWNLOAD_INVOICE: "Failed to download invoice",
  BOOKING_NOT_FOUND: "Booking not found",
  FAILED_TO_GENERATE_RECEIPT: "Failed to generate receipt",
  FAILED_TO_FETCH_SLOTS: "Failed to fetch available slots",
  FAILED_TO_FETCH_WALLET: "Failed to fetch wallet",
  FAILED_TO_CREDIT_WALLET: "Failed to credit wallet",
  FAILED_TO_DEBIT_WALLET: "Failed to debit wallet",
  FAILED_TO_FETCH_TRANSACTIONS: "Failed to fetch transactions",
  INSUFFICIENT_BALANCE_OR_WALLET_NOT_FOUND:
    "Insufficient balance or wallet not found",
  FAILED_TO_CREATE_RAZORPAY_ORDER: "Failed to create Razorpay order",
  PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
  USERID_NOT_FOUND: "User ID not found",
  INVALID_TOKEN: "Invalid token",
};

export const StudentSuccessMessages = {
  ORDER_MARKED_AS_FAILED: "Order marked as failed",
  SIGNUP_SUCCESS: "Signup successful, OTP sent to email.",
  OTP_SENT: "OTP has been sent to your email successfully!",
  USER_CREATED: "User created successfully!",
  LOGIN_SUCCESS: "User logged in successfully!",
  LOGOUT_SUCCESS: "Logout successful!",
  PASSWORD_RESET: "Password changed successfully!",
  EMAIL_VERIFIED: "Email verified successfully!",
  TOKEN_VERIFIED: "Token verified successfully!",
  GOOGLE_LOGIN_SUCCESS: "Google login successful!",
  REDIERCTING_OTP_PAGE: "Rediercting To OTP Page",
  REDIERCTING_PASSWORD_RESET_PAGE: "Redirecting to Reset Password Page",

  PROFILE_FETCHED: "your profile fecthed successfully",
  PROFILE_UPDATED: "your profile is updated successfully",
  PASSWORD_UPDATED: "your password is successfully updated",

  CHAPTER_COMPLETED: "Chapter marked as completed",
  QUIZ_RESULT_SUBMITTED: "Quiz result submitted",

  COURSES_FETCHED: "Courses fetched successfully",
  COURSE_DETAILS_FETCHED: "Course details fetched successfully",

  ORDER_HISTORY_FETCHED: "Order history fetched successfully",
  ORDER_DETAILS_FETCHED: "Order details fetched successfully",
  INVOICE_GENERATED: "Invoice generated successfully",
};

export const OtpResponses = {
  NO_OTP_DATA: "Retry again Failed To Login!",
};

export const AuthErrorMsg = {
  INTERNAL_SERVER_ERROR :"internal server error",
  ACCOUNT_BLOCKED : "Account is blocked",
  USER_NOT_FOUND : "user is not found",
  INVALID_ROLE : "Invalid role",
  NO_ACCESS_TOKEN: "Unauthorized access. Please provide a valid token OR LOGIN",
  NO_REFRESH_TOKEN: "Unauthorized access. Session verification required.",
  INVALID_ACCESS_TOKEN: "Unauthorized access. Please authenticate again.",
  INVALID_REFRESH_TOKEN: "Session verification failed. Please log in again.",
  ACCESS_TOKEN_EXPIRED: "Session expired. Refreshing authentication...",
  REFRESH_TOKEN_EXPIRED: "Session expired. Please log in again.",
  AUTHENTICATION_FAILED: "Authentication failed. Please try again later.",
  PERMISSION_DENIED: "You do not have permission to perform this action.",
  ACCESS_FORBIDDEN: "You do not have permission to perform this action.",
  TOKEN_EXPIRED_NAME: "TokenExpiredError",
  TOKEN_VERIFICATION_ERROR: "Token is not valid.It is verification error",
};

export const GeneralServerErrorMsg = {
  INTERNAL_SERVER_ERROR: "Internal server error!",
  DATABASE_ERROR: "Database operation failed!",
  OPERATION_FAILED: "Operation could not be completed!",
  UNEXPECTED_ERROR: "An unexpected error occurred!",
};

export const JwtErrorMsg = {
  JWT_NOT_FOUND: "JWT not found in the cookies",
  INVALID_JWT: "Invalid JWT",
  JWT_EXPIRATION: "2h" as const,
  JWT_REFRESH_EXPIRATION: "6h" as const,
};

export const EnvErrorMsg = {
  CONST_ENV: "",
  JWT_NOT_FOUND: "JWT secret not found in the env",
  NOT_FOUND: "Env not found",
  ADMIN_NOT_FOUND: "Environment variables for admin credentials not found",
};

export const ResponseError = {
  ACCESS_FORBIDDEN: "Access Forbidden: No access token provided.",
  INTERNAL_SERVER_ERROR: "Internal server error.",
  INVALID_RESOURCE: "Resource not found or invalid",
  DUPLICATE_RESOURCE: "Duplicate resource entered:",
  INVALID_JWT: "JSON Web Token is invalid, try again.",
  EXPIRED_JWT: "JSON Web Token has expired.",
  NO_ACCESS_TOKEN: "No access token provided.",
  INVALID_REFRESH_TOKEN: "Invalid refresh token. Please log in.",
  REFRESH_TOKEN_EXPIRED: "Session expired. Please log in again.",
  NEW_ACCESS_TOKEN_GENERATED: "New access token generated.",
  NOT_FOUND: "Resource Not Found",

  USER_NOT_FOUND: "No user details not found",
  PROFILE_UPDATE: "Profile Updated Successfully",
  PROFILE_NOT_UPDATE: "Profile Not updated",
  USERFETCHING_ERROR: "No users or instructors found",
  FETCH_ERROR: "An error occcured while fetching",

  PASSWORD_UPDATED: "Password Updated Successfully",
  PASSWORD_NOT_UPDATED: "Password Not Updated",
  CURRENTPASSWORD_WRONG: "Current Password is Wrong",

  ACCOUNT_BLOCKED: "Your account has been blocked !",
  ACCOUNT_UNBLOCKED: "Your account has been Unblocked !",

  FETCH_USER: "Users retrieved successfully",
  FETCH_INSTRUCTOR: "Instructors retrieved successfully",
  FETCH_ADMIN: "Admin retrieved successfully",
  FETCH_NOT_INSTRUCTOR: "No instructors retrieved successfully",
  APPROVE_INSTRUCTOR: "Instructor Records Approved ",
  REJECT_INSTRUCTOR: "Instructor Records Rejected ",

  BANNER_CREATED: "Banner added successfully!",
  BANNER_UPDATED: "Banner updated successfully",
  FETCH_BANNER: "banners retrieved successfully",

  REPORT_ADDED: "Report Instructor Successfully",
  FETCH_REPORTS: "Report Fetched...",
};

export const S3BucketErrors = {
  ERROR_GETTING_IMAGE:
    "Error gettting the image from S3 Bucket! or Failed to get the uploaded file URL from s3",
  NO_FILE: "No file uploaded",
  BUCKET_REQUIREMENT_MISSING: "Missing required AWS s3 environment variables",
};

export const VerificationErrorMessages = {
  NO_DOCUMENTS_RECEIVED: "No documents received.",
  DOCUMENTS_MISSING: "Required documents are missing.",
  VERIFICATION_REQUEST_FAILED: "Failed to submit verification request.",
  REVERIFICATION_REQUEST_FAILED: "Failed to submit re-verification request.",
  REQUEST_DATA_NOT_FOUND: "Verification request data not found.",
  ALL_REQUESTS_NOT_FOUND: "No verification requests found.",
  APPROVAL_FAILED: "Failed to approve/reject verification request.",
  INTERNAL_SERVER_ERROR:
    "An unexpected error occurred. Please try again later.",
  INVALID_DATA: "Invalid data provided. Please check your inputs.",
  UPLOAD_FAILED: "Failed to upload documents. Please try again.",
};

export const VerificationSuccessMessages = {
  VERIFICATION_REQUEST_SENT: "Verification request sent successfully.",
  REVERIFICATION_REQUEST_SENT: "Re-verification request sent successfully.",
  REQUEST_DATA_FETCHED: "Verification request data fetched successfully.",
  ALL_REQUESTS_FETCHED: "All verification requests fetched successfully.",
  REQUEST_APPROVED: "Verification request approved successfully.",
  REQUEST_REJECTED: "Verification request rejected successfully.",
  INSTRUCTOR_VERIFIED: "Instructor verified successfully.",
  DOCUMENTS_UPLOADED: "Documents uploaded successfully.",
};

export const CategorySuccessMsg = {
  CATEGORY_ADDED: "Category added successfully!",
  CATEGORY_UPDATED: "Category updated successfully!",
  CATEGORY_FETCHED: "Fetched categories successfully!",

  CATEGORY_FOUND: "Category found successfully!",
  CATEGORY_LISTED: "Category listed successfully!",
  CATEGORY_UNLISTED: "Category unlisted successfully!",
};

export const CategoryErrorMsg = {
  CATEGORY_EXISTS: "Category already exists!",
  CATEGORY_NOT_UPDATED: "Category not updated!",
  CATEGORY_FAILED_TO_FETCH: "Failed to fetch categories",
  CATEGORY_NOT_FOUND: "Category not found!",
  CATEGORY_NOT_CREATED: "Could not create category!",
  CATEGORY_NOT_FETCHED: "Could not fetch categories!",
  CATEGORY_LISTING_FAILED: "Failed to list/unlist category!",
  INTERNAL_SERVER_ERROR: "Internal server error!",
};

export const CourseErrorMessages = {
  MISSING_FILES: "Missing files.",
  COURSE_NOT_FOUND: "Course not found.",
  COURSE_ID_NOT_FOUND: "CourseId not found.",
  CHAPTERS_NOT_FOUND: "Chapters not found.",
  INSTRUCTOR_ID_REQUIRED: "Instructor ID is required.",
  INVALID_PAGE_OR_LIMIT: "Invalid page or limit value.",
  CHAPTER_ID_REQUIRED: "ChapterId is not provided in the query.",
  ADD_QUIZ_TO_PUBLISH: "Add Quiz to Publish Course!",
  ADD_CHAPTERS_TO_PUBLISH: "Add chapters to Publish Course!",
  NO_COURSE_DATA_FOUND: "No courseData found.",
  INTERNAL_ERROR: "Internal Error.",
  SOMETHING_WENT_WRONG: "Something wrong Please try Later!",
  ERROR_UPDATING_COURSE: "Error updating Course.",
};

export const CourseSuccessMessages = {
  COURSE_CREATED: "Course created successfully.",
  COURSE_UPDATED: "Course updated successfully.",
  COURSE_ALREADY_PURCHASED: "Course already purchased!",
  COURSE_PUBLISHED: "Course Published",
  COURSE_UNPUBLISHED: "Course UnPublished",
  COURSE_LISTED: "Course Listed",
  COURSE_UNLISTED: "Course unListed",
  COURSE_DELETED: "Course Deleted!",
  COURSES_FETCHED: "Courses fetched successfully.",
  COURSE_FETCHED: "Course fetched successfully.",
  COURSE_CATEGORIES_FETCHED: "Fetched course categories!",
  INSTRUCTOR_COURSES_FETCHED: "User courses fetched!",
  COURSES_DATA_FETCHED: "Fetched courses data successfully",
  BOUGHT_COURSES_FETCHED: "Buyed Courses Got Successfully",
  THANK_YOU_FOR_ENROLLING: "Thank you for Enrolling!",
  CHAPTER_COMPLETED: "Chapter Completed",
  PLAY_DATA_RETRIEVED: "Retrieved play data",
};
export const QuizErrorMessages = {
  NO_COURSE_FOUND: "No course found.",
  NO_USER_FOUND: "No user found.",
  QUIZ_ID_REQUIRED: "Quiz ID is required.",
  COURSE_ID_REQUIRED: "Course ID is required.",
  INVALID_QUIZ_DATA: "Invalid quiz data provided.",
  INTERNAL_SERVER_ERROR: "Internal server error.",
  QUIZ_OR_QUESTION_NOT_FOUND: "Quiz or question not found",
  QUIZ_ALREAD_CREATED:
    "Quiz already exists for this course. Please manage questions instead.",
  QUIZ_NOT_FOUND: "Quiz is not found",
};

export const QuizSuccessMessages = {
  QUIZ_CREATED: "Quiz section for this course is created",
  QUIZ_DELETED: "Quiz section for this course is deleted",
  QUESTION_ADDED: "Question added successfully.",
  QUESTION_UPDATED: "Question updated successfully.",
  QUIZ_FETCHED: "Quiz fetched successfully.",
  QUESTION_DELETED: "question deleted successfully",
  COURSE_COMPLETED: "Course completed successfully!",
  RETRY_QUIZ: "Retry quiz!",
};

export const ChapterErrorMessages = {
  CHAPTER_ALREADY_EXIST:
    "Chapter already exists with this title in this course",
  CHAPTER_REQUIRE_VIDEOFILE: "Video file is required",
  CHAPTER_NOT_FOUND: "chapter not found",
  CHAPTER_NUMBER_ALREADY_EXIST:
    "Chapter with this number already exists in this course",
};

export const ChapterSuccessMessages = {
  CHAPTER_CREATED: "chapter created successfully",
  CHAPTER_RETRIEVED: "Course related chapters are retrieved",
  CHAPTER_UPDATED: "Chapter is updated successfully",
  CHAPTER_DELETED: "Chapter is deleted successfully",
};

export const CartErrorMessage = {
  COURSE_ALREADYEXIST_IN_CART: "course already exist in cart",
  FAILED_TO_ADD_COURSE_IN_CART: "Failed to add course to cart",
  FAILED_TO_REMOVE_COURSE_FROM_CART: "Failed to remove course from cart",
  FAILED_TO_CLEAR_CARTDATE: "Failed to remove cart data",
};

export const CartSuccessMessage = {
  CART_DATA_FETCHED: "Cart fetched successfully",
  CART_EMPTY: "Cart is empty",
  COURSE_ADDED_IN_CART: "Course added to cart",
  COURSE_REMOVED_FROM_CART: "Course removed from cart",
  CART_DATA_CLEARED: "Cart cleared",
};

export const WishlistSuccessMessage = {
  COURSE_ADDED: "Course added to wishlist successfully",
  COURSE_REMOVED: "Course removed from wishlist successfully",
  COURSE_LIST_FETCHED: "Wishlist fetched successfully",
};

export const WishlistErrorMessage = {
  COURSE_ALREADY_IN_WISHLIST: "Course already exists in wishlist",
  FAILED_TO_REMOVE_COURSE: "Failed to remove course from wishlist",
  FAILED_TO_FETCH_LIST: "Failed to fetch wishlist courses",
  FAILED_TO_CHECK_EXISTENCE: "Failed to check if course is in wishlist",
};

export const CheckoutErrorMessages = {
  USER_NOT_AUTHENTICATED: "User not authenticated.",
  CHECKOUT_FAILED: "Checkout initiation failed.",
  PAYMENT_FAILED: "Checkout completion failed.",
};

export const CheckoutSuccessMessage = {
  ORDER_CREATED: "Order created successfully",
  PAYMENT_SUCCESS_COURSE_ENROLLED: "Payment successful and courses enrolled",
};

export const EnrolledErrorMessage = {
  FAILED_TO_FETCH_ENROLLED_COURSES: "Failed to fetch enrolled courses",
  FAILED_TO_FETCH_PARTICULAR_COURSE: "Failed to fetch enrollment details",
  FAILED_TO_MARK_CHAPTER_COMPLETED: "Failed to mark chapter as completed",
};

export const EnrolledSuccessMessage = {
  CHAPTER_COMPLETED: "Chapter marked as completed",
};

export const MembershipMessages = {
  CREATE_SUCCESS: "Membership plan created successfully.",
  CREATE_FAILURE: "Failed to create membership plan.",
  UPDATE_SUCCESS: "Membership plan updated successfully.",
  UPDATE_FAILURE: "Failed to update membership plan.",
  DELETE_SUCCESS: "Membership plan deleted successfully.",
  DELETE_FAILURE: "Failed to delete membership plan.",
  FETCH_ONE_SUCCESS: "Membership plan fetched successfully.",
  FETCH_ONE_FAILURE: "Failed to fetch membership plan.",
  FETCH_ALL_SUCCESS: "Membership plans fetched successfully.",
  FETCH_ALL_FAILURE: "Failed to fetch membership plans.",
  NOT_FOUND: "Membership plan not found.",
};

export const ResponseMessages = {
  MISSING_DATA: "Missing data",
  INSTRUCTOR_NOT_FOUND: "Instructor not found",
  ALREADY_ACTIVE_MEMBERSHIP: "You already have an active membership plan.",
  CHECKOUT_FAILED: "Failed to initiate checkout",
  MEMBERSHIP_ACTIVATED: "Membership activated",
  VERIFICATION_FAILED: "Verification failed",
  WALLET_PURCHASE_FAILED: "Membership Purchasing via wallet is failed",
};

export const INSTRUCTOR_REVENUE_SHARE = 0.9;

export const INSTRUCTOR_MEMBERSHIP_ERROR_MESSAGE = {
  SOMETHING_WENT_WRONG : "Something went wrong.",
  INSTRUCTOR_NOT_FOUND:"Instructor not found",
}

export const INSTRUCTOR_MEMBERSHIP_ORDER_SUCCESS_MESSAGE = {
  MARKED_AS_FAILED:"Order marked as failed successfully"

}

export const INSTRUCTOR_MEMBERSHIP_ORDER_ERROR_MESSAGE = {
  FAILED_TO_CREATE_RAZORPAY_ORDER:"Failed to create Razorpay order",
  FAILED_TO_RETRY_ORDER:"Failed to retry order",
  INSTRUCTOR_NOT_FOUND:"Instructor not found",
  FAILED_TO_CANCEL:"Failed to cancel order",
  FAILED_TO_MARK_AS_FAILED:"Failed to mark order as failed"
}

export const INSTRUCTOR_SLOT_BOOKING_ERROR_MESSAGE = {
  FAILED_TO_FETCH_BOOKING_DETAILS:"Failed to fetch booking detail",
}

export const INSTRUCTOR_SLOT_ERROR_MESSAGE = {
  FAILED_TO_FETCH_SLOT_STAT:"Failed to fetch slot stats",
  FAILED_TO_FETCH_SLOT:"Failed to fetch slots",
  FAILED_TO_DELETE_SLOT:"Failed to delete slot",
  FAILED_TO_UPDATE_SLOT:"Failed to update slot",
  FAILED_TO_CREATE_SLOT:"Failed to create slot"
}

export const INSTRUCTOR_SPECIFIC_COURSE_CONTROLLER = {
  FAILED_TO_FETCH_COURSE_DASHBOARD:"Failed to fetch course dashboard",
  INVALID_COURSE_ID:"Invalid Course ID",
}

export const INSTRUCTOR_ERROR_MESSAGE = {
  UNAUTHORIZED_ID:"Unauthorized: Instructor ID not found.",
  INTERNAL_SERVER_ERROR:"Internal Server Error",
  INSTRUCTOR_UNAUTHORIZED: "Unauthorized",
  INVALID_RANGE: "Invalid or missing range",
  INVALID_PAGE_LIMIT: "Invalid page or limit",
  INVALID_PARAMETERS: "Missing or invalid parameters",
  BLOCK_CHECK: "Status check failed",
  COURSE_ALREADY_CREATED: "You have already created a course with this name.",
  COURSE_ALREADY_WITH_THIS_NAME:
    "You have already created another course with this name.",
  PUBLISH_COURSE_CONDITION:
    "Course must have at least one chapter and one quiz question to be published",
  FAILED_TO_PURCHASE_HISTORY: "Failed to fetch purchase history",
  DATA_MISSING: "Missing data",
  ORDER_NOT_FOUND: "Order not found",
  FAILED_TO_FETCH_ORDER: "Failed to fetch order",
  TXNID_NOT_FOUND: "Missing txnId or user not authenticated",
  FAILED_TO_GENERATE_RECEIPT: "Failed to generate receipt",
  QUIZ_NOT_FOUND: "Quiz not found",
  INVALID_COURSE_ID: "Invalid Course ID",
  INVALID_RANGE_TYPE: "Invalid or missing range type",
  FAILED_TO_FETCH_COURSE_REVENUE_REPORT:
    "Failed to fetch course revenue report",
  COURSE_ID_INVALID: "Invalid Course ID",
  FORMAT_ERROR: "Format must be either 'pdf' or 'excel'",
  FAILED_TO_EXPORT_REVENUE_REPORT: "Failed to export revenue report",
  VERIFICATION_ALREADY_SUBMITTED:
    "Verification already submitted and under review.",
  INSTRUCTOR_ALREADY_VERIFIED: "You are already verified.",
  FAILED_TO_FETCH_WALLET: "Failed to fetch wallet",
  FAILED_TO_CREDIT_WALLET: "Failed to credit wallet",
  INSUFFICIENT_BALANCE_OR_WALLET_NOT_FOUND:
    "Insufficient balance or wallet not found",
  FAILED_TO_DEBIT_WALLET: "Failed to debit wallet",
  FAILED_TO_FETCH_TRANSACTION_HISTORY: "Failed to fetch transaction history",
  FAILED_TO_CREATE_RAZORPAY_ORDER: "Failed to create Razorpay order",
  INSTRUCTOR_ID_NOT_FOUND: "Instructor ID not found",
  PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
  FAILED_TO_CREATE_WITHDRAWAL_REQUEST: "Failed to create withdrawal request",
  FAILED_TO_FETCH_WITHDRAWAL_REQUEST: "Failed to fetch withdrawal requests",
  FAILED_TO_RETRY_WITHDRAWAL_REQUEST: "Failed to retry withdrawal request",
  INVALID_FORMAT: "Invalid export format. Allowed formats: pdf, excel",
  NO_DATA_FOUND: "No data found for the specified date range",
};

export const INSTRUCTOR_SUCCESS_MESSAGE = {
  COURSE_PUBLISHED: "Course published successfully",
  REVIFICATION_SUBMITTED: "Reverification submitted successfully.",
  WITHDRAWAL_REQUEST_CREATED: "Withdrawal request created successfully",
  WITHDRAWAL_REQUEST_RETRIED_SUCCESSFULLY:
    "Withdrawal request retried successfully",
};

export const SERVER_ERROR = {
  INTERNAL_SERVER_ERROR: "internal server error",
};



export const MESSAGES = {
  // General Messages
  EMAIL_REQUIRED: "Email is required",
  PASSWORD_REQUIRED: "Password is required",
  USERNAME_REQUIRED: "Username is required",
  OTP_REQUIRED: "OTP is required",
  NAME_REQUIRED: "Name and email are required",

  // Success Messages
  SIGNUP_SUCCESS: "Signup successful",
  OTP_SENT: "OTP sent successfully",
  USER_CREATED: "User created successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REDIERCTING_OTP_PAGE: "Redirecting to OTP page",
  REDIERCTING_PASSWORD_RESET_PAGE: "Redirecting to password reset page",
  PASSWORD_RESET: "Password reset successful",
  GOOGLE_LOGIN_SUCCESS: "Google login successful",

  // Error Messages
  USER_ALREADY_EXISTS: "User already exists",
  FAILED_TO_CREATE_OTP: "Failed to create OTP",
  INCORRECT_OTP: "Incorrect OTP",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_BLOCKED: "Account is blocked",
  USER_NOT_FOUND: "User not found",
  TOKEN_INVALID: "Invalid or missing token",
  NOT_FOUND_STUDENT: "Student not found",
  STATUS_CHECK_FAILED: "Status check failed",
  FAILED_TO_RESET_PASSWORD: "Failed to reset password",
};