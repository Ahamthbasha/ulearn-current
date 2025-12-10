export interface AdminCourse extends Record<string, unknown> {
  _id: string;
  courseId: string;
  courseName: string;
  isListed: boolean;
}

export interface CourseApiResponse {
  courseId: string;
  courseName: string;
  isListed: boolean;
}

export interface GetCoursesResult {
  data: CourseApiResponse[];
  total: number;
}



export interface IAdminReviewDTO extends Record<string, unknown> {
  _id: string;
  courseId: string;
  courseTitle?: string;
  studentId: string;
  studentName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  flaggedByInstructor: boolean;
  isDeleted: boolean;
  rejectionReason?: string | null;
  status: "pending" | "approved" | "rejected" | "deleted";
}

export interface IReviewDetail {
  _id: string;
  courseId: string;
  studentId?: string;
  studentName?: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  flaggedByInstructor: boolean;
  isDeleted: boolean;
  rejectionReason?: string | null;
  status: string;
}

export interface WithdrawalRequestRecord extends Record<string, unknown> {
  requestId: string;
  instructorName: string;
  instructorEmail: string;
  amount: number;
  status: string;
  bankAccount: string;
  createdAt: string;
}

export interface UserListingRecord extends Record<string, unknown> {
  id: string;
  username: string;
  email: string;
  status: string;
  created: string;
  isBlocked: boolean;
  serialNo?: number; // Optional field for serial number
}

// Type for backend user response
export interface BackendUser {
  _id?: string;
  name?: string;
  email?: string;
  status?: boolean;
  createdAt?: string;
}

// Type for API response
export interface GetAllUserResponse {
  success: boolean;
  message?: string;
  users: BackendUser[];
  total?: number;
}

export interface IMembershipPlan extends Record<string, unknown> {
  _id: string;
  name: string;
  durationInDays: number;
  price: number;
  isActive: boolean;
  createdAt: string;
}

// API response type for membership plans
export interface GetMembershipPlansResult {
  plans: IMembershipPlan[];
  total: number;
  success?: boolean;
}

// API request parameters
export interface GetMembershipPlansParams {
  page: number;
  limit: number;
  search: string;
}

export interface FormHelpers {
  setSubmitting: (isSubmitting: boolean) => void;
  setFieldError: (field: string, message: string) => void;
}

export interface InstructorApiResponse {
  id: string;
  name: string;
  email: string;
  status: boolean;
  createdAt: string;
}
export interface GetInstructorsResult {
  instructors: InstructorApiResponse[];
  total: number;
  success?: boolean;
}
export interface BlockInstructorResponse {
  success: boolean;
  message: string;
}
export interface Instructors extends Record<string, unknown> {
  id: string;
  username: string;
  email: string;
  status: string;
  created: string;
  isBlocked: boolean;
}

export interface IAdminCourseOffer extends Record<string, unknown> {
  offerId: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  discount: number;
  status: string;
}

export interface CourseOfferApiResponse {
  offerId: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  discount: number;
  status: string;
}

export interface GetCourseOffersResult {
  data: CourseOfferApiResponse[];
  total: number;
}

export interface Category extends Record<string, unknown> {
  _id: string;
  categoryName: string;
  isListed: boolean;
  serialNo?: number;
}

export interface GetCategoriesResponse {
  data: Category[];
  total: number;
}

export interface ApiError {
  message?:string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  );
};


interface Question {
  questionId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  quizId: string;
  questions: Question[];
}

interface Chapter {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  chapterNumber?: number;
  videoUrl: string;
}

interface Course {
  courseId: string;
  courseName: string;
  description: string;
  price: number;
  level: string;
  duration: string;
  isListed: boolean;
  isPublished: boolean;
  isVerified: boolean;
  isSubmitted:boolean;
  review:string
  demoVideo: string;
  thumbnailUrl: string;
}

export interface CourseDetailsResponse {
  course: Course;
  chapters: Chapter[];
  quiz: Quiz | null;
}

export interface AdminCourse {
  _id: string; 
  courseId: string; 
  courseName: string;
  isListed: boolean;
}

export interface SalesData {
  month: number;
  year: number;
  total: number;
}

export interface TopCourse {
  courseName: string;
  salesCount: number;
}

export interface TopCategory {
  categoryName: string;
}

export interface DashboardData {
  instructorCount: number;
  mentorCount: number;
  courseCount: number;
  courseRevenue: number;
  membershipRevenue: number;
  courseSalesGraph: SalesData[];
  membershipSalesGraph: SalesData[];
  topCourses: TopCourse[];
  topCategories: TopCategory[];
}

export interface ReportFilter {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate?: Date;
  endDate?: Date;
}

export interface CourseReportRow {
  orderId: string;
  date: string;
  couponCode:string|undefined;
  courses: {
    courseName: string;
    instructorName: string;
    coursePrice: number;
    offerPrice?:number;
    adminShare: number;
    discountedPrice:number;
  }[];
  totalPrice: number;
  totalAdminShare: number;
}

export interface MembershipReportRow {
  orderId: string;
  planName: string;
  instructorName: string;
  price: number;
  date: string;
}


export interface FormValues {
  name: string;
  durationInDays: string;
  price: string;
  description?: string;
  benefits?: string;
}

export interface IMembershipPlan {
  _id: string;
  name: string;
  durationInDays: number;
  price: number;
  isActive: boolean;
  createdAt: string;
}

interface InstructorMembershipOrderDetail {
  name: string;
  email: string;
}

interface MembershipPlan {
  name: string;
  durationInDays: number;
  description: string;
  benefits: string[];
}

export interface MembershipOrder {
  instructor: InstructorMembershipOrderDetail;
  membershipPlan: MembershipPlan;
  price: number;
  paymentStatus: "pending" | "paid" | "failed";
  startDate: string;
  endDate: string;
  razorpayOrderId: string;
  createdAt: string;
}

export interface MembershipOrderDTO {
  instructorName: string;
  orderId: string;
  membershipName: string;
  price: number;
  status: "paid" | "pending" | "failed";
}

export interface UserListing {
  id: string;
  username: string;
  email: string;
  status: "Blocked" | "Active";
  created: string;
  isBlocked: boolean;
}

export interface VerificationRequest {
  _id: string;
  username: string;
  email: string;
  status: string;
  resumeUrl: string;
  degreeCertificateUrl: string;
  reviewedAt?: Date;
}


export interface VerificationRequestPage extends Record<string, unknown> {
  id: string;
  username: string;
  email: string;
  status: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  data: VerificationRequestPage[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Transaction {
  amount: number;
  type: "credit" | "debit";
  description: string;
  txnId: string;
  date: string;
}

export interface Wallet {
  balance: number;
}

export interface WithdrawalRequestDto {
  requestId: string;
  instructorName: string;
  instructorEmail: string;
  amount: number;
  status: string;
  createdAt: string;
  bankAccount: string;
}

export type StatusFilter = "" | "pending" | "approved" | "rejected";

export interface IWithdrawalRequestDetail {
  requestId: string;
  instructorName: string;
  instructorEmail: string;
  amount: number;
  requestDate: string;
  bankAccountLinked: "Linked" | "Not Linked";
  remarks?: string;
}

export interface MembershipOrderRecord extends Record<string, unknown> {
  orderId: string;
  instructorName: string;
  membershipName: string;
  price: number;
  status: string;
}


export interface GetMembershipPlansResult {
  plans: IMembershipPlan[];
  total: number;
  success?: boolean;
}

export interface AdminApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}
