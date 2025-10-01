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
  date: Date;
  couponCode:boolean;
  courses: {
    courseName: string;
    instructorName: string;
    coursePrice: number;
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
  date: Date;
}

export interface Instructors {
  id: string;
  username: string;
  email: string;
  status: "Blocked" | "Active";
  created: string;
  isBlocked: boolean;
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


export interface VerificationRequestPage {
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