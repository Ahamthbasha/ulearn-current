export interface Chapter {
  courseId: string;
  chapterId: string;
  chapterTitle: string;
  videoUrl: string;
  chapterNumber?: number;
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
  description: string;
  duration: string;
  price: number;
  level: string;
  categoryName: string;
  thumbnailSignedUrl: string | null;
  demoVideoUrlSigned: string | null;
  isPublished: boolean;
  isListed: boolean;
  isVerified: boolean;
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
}

export interface MembershipPlanOrderDetail {
  name: string;
  durationInDays: number;
  description?: string;
  benefits?: string[];
}

export interface InstructorInfoMembershipPlanOrderDetail {
  name: string;
  email: string;
}

export interface IMembershipOrderDetail {
  instructor: InstructorInfoMembershipPlanOrderDetail; 
  membershipPlan: MembershipPlanOrderDetail; 
  price: number;
  paymentStatus: "pending" | "paid" | "failed"; 
  txnId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
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