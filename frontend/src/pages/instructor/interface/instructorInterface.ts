
export interface Module extends Record<string,unknown> {
  _id?: string;
  moduleTitle: string;
  courseId: string;
  moduleNumber: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  durationFormatted:string;
}

export interface ModuleFormValues {
  moduleTitle: string;
  description: string;
}

export interface VerificationFormValues {
  name: string;
  email: string;
  degreeCertificate: File | null;
  resume: File | null;
}

export type TableCourse = Course & Record<string, unknown>;

export interface SlotStatWithIndex extends SlotStat {
  [key: string]: unknown;
}
export interface FormValues {
  discount: number;
  startDate: string | Date;
  endDate: string | Date;
}
export interface ChapterFormValues {
  chapterTitle: string;
  description: string;
  chapterNumber: number;
}

export interface InstructorProfile {
  _id?: string;
  instructorName: string;
  email: string;
  role?: string;
  isBlocked?: boolean;
  skills?: string[];
  expertise?: string[];
  status: boolean;
  mentor: boolean;
  bankAccountLinked: boolean;
  profilePicUrl?: string;
}

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface BankFormValues {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface Chapter {
  moduleId: string;
  chapterId: string;
  chapterTitle: string;
  videoUrl: string;
  chapterNumber: number;
  description?: string;
  durationFormatted:string;
}

export interface Category {
  _id: string;
  categoryName: string;
}

export interface Course {
  courseId: string;
  courseName: string;
  thumbnailUrl: string;
  category: string;
  status: boolean;
}

export interface CourseManagement {
  courseId: string;
  courseName: string;
  categoryName: string;
  level: string;
  durationFormatted: string;
  price: number;
  description: string;
  thumbnailSignedUrl?: string;
  demoVideoUrlSigned?: string;
  isPublished: boolean;
  isListed: boolean;
  isSubmitted:boolean;
  review:string;
  isVerified: boolean;
  publishDate?: string; 
}

export interface MembershipPlan {
  _id: string;
  name: string;
  durationInDays: number;
  description?: string;
  price?: number;
  benefits?: string[];
}

export interface MembershipOrder {
  orderId: string;
  planName: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  purchaseDate: string;
}

export interface DisplayOrder extends MembershipOrder {
  formattedAmount: string;
  formattedDate: string;
  statusDisplay: string;
  [key: string]: unknown;
}
export interface SlotDetail {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
}

export interface UserDetail {
  username: string;
  email: string;
}

export interface BookingDetail {
  _id: string;
  slotId: SlotDetail;
  studentId?: UserDetail;
  instructorId: UserDetail;
  createdAt: string;
  updatedAt: string;
}

export interface SlotStat {
  date: string;
  totalSlots: number;
  bookedSlots: number;
}

export interface ISlotPage {
  _id: string;
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
}


export interface MonthlyData {
  month: number;
  year: number;
  totalSales: number;
}

export interface ReportItem {
  orderId: string;
  courseName: string;
  purchaseDate: string;
  coursePrice: number;
  instructorRevenue: number;
  totalEnrollments: number;
  originalCoursePrice: number;
  courseOfferPrice: number;
  couponUsed:string;
  couponDeductionAmount:number;
  finalCoursePrice:number
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



//withdrawal

export interface WalletResponse {
  success: boolean;
  wallet: {
    ownerId: string;
    balance: number;
  };
}

export interface TransactionResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    currentPage: number;
    totalPages: number;
    total: number;
  };
}

export interface IWithdrawalRequest {
  requestId?: string;
  instructorName?: string;
  instructorEmail?: string;
  amount?: number;
  status: string;
  bankAccount?: string;
  createdAt?: string;
  reason?: string;
}


export interface InstructorData {
  id: string;
  email: string;
  name: string;
  role: string;
  isBlocked: boolean;
  isVerified: boolean;
}



export interface ICourseOffer extends Record<string, unknown> {
  courseOfferId: string;
  courseId: string;
  courseName: string;
  discount: number;
  status: "pending" | "approved" | "rejected";
  startDate: string;
  endDate: string;
}

export interface ICourseOfferDetails {
  courseOfferId: string;
  courseId: string;
  courseName : string;
  courseOriginalPrice: number;
  discount: number;
  courseDiscountPrice: number;
  startDate: string; 
  endDate: string; 
  status: string;
  reviews: string;
}

export interface ICourses {
  courseId: string;
  courseName: string;
}

export interface IMembershipOrderDetail {
  orderId: string;
  instructor: {
    name: string;
    email: string;
  };
  membershipPlan: {
    name: string;
    durationInDays: number;
    description: string;
    benefits: string[];
  };
  price: number;
  paymentStatus: string;
  startDate: string;
  endDate: string;
  razorpayOrderId: string;
  createdAt: string;
}