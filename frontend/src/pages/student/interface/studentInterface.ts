export interface CartCourseDTO {
  courseId: string;
  courseName: string;
  price: number;
  thumbnailUrl: string;
}



export interface Course {
  _id: string;
  courseName: string;
  price: number;
  thumbnailUrl: string;
}

export interface Wallet {
  balance: number;
}


export interface CourseList {
  courseId: string;
  courseName: string;
  instructorName: string;
  categoryName: string;
  thumbnailUrl: string;
  demoVideoUrl: string;
  chapterCount: number;
  quizQuestionCount: number;
  duration: string;
  description: string;
  level: string;
  price: number;
}

export interface Category {
  _id: string;
  categoryName: string;
  isListed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilterResponse {
  success: boolean;
  data: CourseList[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseDetail {
  courseId: string;
  courseName: string;
  instructorName: string;
  categoryName: string;
  thumbnailUrl: string;
  demoVideoUrl: string;
  chapterCount: number;
  quizQuestionCount: number;
  duration: string;
  description: string;
  level: string;
  price: number;
}

export interface CartItem {
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  price: number;
}


export interface MonthlyPerformanceItem {
  month: number | null;
  year: number | null;
  count: number;
  totalAmount: number;
}

export interface DashboardData {
  totalCoursesPurchased: number;
  totalCoursesCompleted: number;
  totalCoursesNotCompleted: number;
  totalCoursePurchaseCost: number;
  totalSlotBookings: number;
  totalSlotBookingCost: number;
  coursePerformance: MonthlyPerformanceItem[];
  slotPerformance: MonthlyPerformanceItem[];
}

export interface IStudentCourseReportItem {
  orderId: string;
  date: string;
  courseName: string[] | string;
  price: number[] | number;
  totalCost: number;
  couponCode:string | boolean;
  couponDiscountPercent:number;
  originalTotalPrice:number;
  couponDiscountAmount:number;
  finalTotalPrice:number;
}

export interface IStudentSlotReportItem {
  bookingId: string;
  date: string;
  slotTime: {
    startTime: string;
    endTime: string;
  };
  instructorName: string;
  price: number;
  totalPrice: number;
}

export interface ReportFilter {
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  startDate?: string;
  endDate?: string;
  page: number;
}


export interface ErrorBoundaryProps {
  children: React.ReactNode;
}



export interface Chapter {
  _id: string;
  chapterTitle: string;
  videoUrl: string;
}

export interface Quiz {
  _id: string;
  title: string;
  totalQuestions: number;
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: string;
  }[];
}

export interface EnrollCourse {
  _id: string;
  courseName: string;
  description: string;
  thumbnailUrl: string;
  demoVideo?: {
    type: string;
    url: string;
  };
  chapters: Chapter[];
  quizzes: Quiz[];
}

export interface Enrollment {
  _id: string;
  courseId: EnrollCourse;
  completedChapters: { chapterId: string }[];
}


export interface EnrollmentWithDetail {
  _id: string;
  courseId: Course;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  certificateGenerated: boolean;
}


export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizAttempt {
  _id: string;
  title: string;
  totalQuestions: number;
  questions: QuizQuestion[];
}



export interface Instructor {
  _id: string;
  username: string;
  profilePicUrl?: string;
  skills?: string[];
  expertise?: string[];
}


export interface InstructorDetail {
  _id: string;
  username: string;
  email: string;
  mobileNo?: string;
  profilePicUrl?: string;
  skills?: string[];
  expertise?: string[];
}


export interface CourseOrder {
  courseName: string;
  thumbnailUrl: string;
  price: number;
}

export interface Order {
  customerName: string;
  customerEmail: string;
  payment: string;
  totalAmount: number;
  status: string;
  orderId: string;
  orderDate: string;
  courses: CourseOrder[];
  canRetryPayment:boolean;
  retryInProgress:boolean;
  totalAmountWithoutDiscount:number;
  couponCode?: string;
  couponDiscountPercentage?: number;
  couponDiscountAmount?: number;
}

export interface OrderHistory {
  orderId: string;
  amount: number;
  gateway: string;
  date: string;
  status: string;
  
}

export interface DisplayOrder extends OrderHistory {
  formattedAmount: string;
  formattedGateway: string;
  statusDisplay: string;
}


export interface BookingDetailDTO {
  studentName: string;
  studentEmail: string;
  instructorName: string;
  instructorEmail: string;
  bookingStatus: string;
  bookingId: string;
  bookedDateTime: string;
  slotId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  price: number;
  txnId: string;
}


export interface Booking {
  orderId: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "confirmed" | "pending" | "cancelled";
}

export interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}


export interface Transaction {
  amount: number;
  type: "credit" | "debit";
  description: string;
  txnId: string;
  date: string;
}


export interface WishlistItem {
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  price: number;
}

export interface LandingPageCourse {
  courseId: string;
  courseName: string;
  instructorName: string;
  categoryName: string;
  thumbnailUrl: string;
  demoVideoUrl: string;
  chapterCount: number;
  quizQuestionCount: number;
  duration: string;
  description: string;
  level: string;
  price: number;
}


//videocall

export interface JoinRoomPayload {
  roomId: string;
  email: string;
  role: "student" | "instructor";
}

export interface UserJoinedPayload {
  email: string;
  role: "student" | "instructor";
  userId: string;
  name?: string;
}

export interface OfferPayload {
  offer: RTCSessionDescriptionInit;
  from: string;
}

export interface AnswerPayload {
  answer: RTCSessionDescriptionInit;
  from: string;
}

export interface CandidatePayload {
  candidate: RTCIceCandidateInit;
  from: string;
}

export interface SlotOrderHistory {
  orderId: string;
  amount: number;
  gateway: string;
  date: string;
  status?: string; // Optional since it might not be in response
}
