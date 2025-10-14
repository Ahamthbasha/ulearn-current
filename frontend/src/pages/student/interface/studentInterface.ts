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
  originalPrice: number;
  discountedPrice:number;
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
  originalPrice : number;
  discountedPrice?:number;
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
  totalLearningPathsPurchased:number;
  totalLearningPathsCompleted:number;
  totalLearningPathsNotCompleted:number;
  totalLearningPathPurchaseCost:number;
  totalSlotBookings: number;
  totalSlotBookingCost: number;
  coursePerformance: MonthlyPerformanceItem[];
  slotPerformance: MonthlyPerformanceItem[];
}

export interface IStudentCourseReportItem {
  orderId: string;
  date: string;
  items: Array<{
    type: "course" | "learningPath";
    name: string;
    originalPrice: number;
    finalPrice: number;
  }>;
  originalTotalPrice: number;
  finalTotalPrice: number;
  couponCode?: string;
  couponDiscountPercent?: number;
  couponDiscountAmount?: number;
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
  completionPercentage:number;
}


export interface EnrollmentWithDetail {
  _id: string;
  courseId: Course;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  certificateGenerated: boolean;
  completionPercentage:number
}

export interface EnrolledCourse {
  courseId: string;
  thumbnailUrl: string;
  courseName: string;
  description: string;
  completionStatus: string;
  certificateGenerated: boolean;
  completionPercentage: number;
  price: number;
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
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  courseOriginalPrice: number;
  courseOfferDiscount?: number;
  courseOfferPrice: number;
  isAlreadyEnrolled:boolean;
}

export interface LearningPathInfo {
  learningPathId: string;
  learningPathName: string;
  totalOriginalPrice: number;
  totalOfferPrice: number;
  courses: CourseOrder[];
  thumbnailUrl: string;
}
export interface CouponInfo {
  couponId: string;
  couponCode: string;
  couponDiscountPercentage: number;
  discountAmount: number;
}

export interface UserInfo {
  username: string;
  email: string;
}

export interface Order {
  orderId: string;
  orderDate: string;
  userInfo: UserInfo;
  coursesInfo: CourseOrder[];
  learningPathsInfo: LearningPathInfo[];
  couponInfo?: CouponInfo;
  sumOfAllCourseOriginalPrice: number;
  sumOfAllCourseIncludingOfferPrice: number;
  finalPrice: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
}
export interface OrderHistory {
  orderId: string;
  orderDate: string;
  finalPrice: number;
  status: string;
}

export interface DisplayOrder extends OrderHistory {
  formattedAmount: string;
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
  originalPrice:number;
  discountedPrice:number;
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
  status?: string;
}
export interface LearningPathCourse {
  _id: string;
  duration: string;
  thumbnailUrl: string;
}

export interface LearningPath {
  learningPathId: string;
  title: string;
  description: string;
  noOfCourses: number;
  hoursOfCourses: number;
  thumbnailUrl: string;
  totalPrice: number;
  categoryId: string;
  categoryName: string;
}

export interface LearningPathFilterResponse {
  success: boolean;
  data: LearningPath[];
  total: number;
  page: number;
  limit: number;
}

export interface Category {
  _id: string;
  categoryName: string;
}

export interface LearningPathCardProps {
  learningPathId: string;
  title: string;
  description: string;
  noOfCourses: number;
  hoursOfCourses: number;
  thumbnailUrl: string;
  totalPrice: number;
  categoryName: string;
}




export interface LearningPathDetail {
  learningPathId: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  noOfCourses: number;
  hoursOfCourses: number;
  courses: { courseId: string; courseName: string }[];
  learningPathThumbnailUrl: string;
  categoryId: string;
  categoryName: string;
  totalPrice: number;
}


export interface WishlistItem {
  itemId: string;
  name: string;
  price: number;
  thumbnailUrl: string;
  type: "course" | "learningPath";
}

export interface CartItemDTO {
  itemId: string;
  type: "course" | "learningPath";
  title: string;
  price: number;
  thumbnailUrl: string;
}


export interface EnrolledLearningPath {
  id: string;
  title: string;
  totalPrice: number;
  description: string;
  noOfCourses: number;
  noOfHours: number;
  presignedThumbnailUrl: string;
  learningPathCompleted: boolean;
  totalCompletionPercentageOfLearningPath: number;
}





export interface EnrolledLearningPath {
  id: string;
  title: string;
  totalPrice: number;
  description: string;
  noOfCourses: number;
  noOfHours: number;
  presignedThumbnailUrl: string;
  learningPathCompleted: boolean;
}

export interface Course {
  courseId: string;
  order: number;
  courseName: string;
  description: string;
  price: number;
  effectivePrice:number;
  thumbnailUrl: string;
  isCompleted: boolean;
  certificateUrl?: string;
  completionPercentage: number; // Added to include completion percentage
}

export interface ILearningPathCompletedCourse {
  courseId: string;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface ILearningPathEnrollment {
  userId: string;
  learningPathId: string;
  enrolledAt: Date;
  completionStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  certificateGenerated: boolean;
  certificateUrl?: string;
  unlockedOrder: number;
  completedCourses: ILearningPathCompletedCourse[];
}

export interface LearningPathDetails {
  learningPathId: string;
  totalPrice: number;
  courses: Course[];
  unlockedCourses: string[];
  enrollment: ILearningPathEnrollment;
}

export interface checkoutCartItem {
  _id: string;
  type: "course" | "learningPath";
  title: string;
  price: number;
  thumbnailUrl: string;
  isAlreadyEnrolled?: boolean; // Added for courses
  enrolledCourses?: string[]; // Added for learning paths
}


export interface ICoupon {
  _id: string;
  code: string;
  discount: number;
  expiryDate: string;
  status: boolean;
  usedBy: string[];
  minPurchase: number;
  maxDiscount: number;
}