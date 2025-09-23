import InstructorRouterEndPoints from "../../types/endPoints/instructorEndPoint";
import fileDownload from "js-file-download";
import { API } from "../../service/axios";
import {
  type IQuestionPayload,
  type ICreateQuizPayload,
} from "../../types/interfaces/IQuiz";

import { type FetchCoursesParams } from "../../types/interfaces/IFetchCoursesParam";
import type { IWithdrawalRequest } from "../../types/interfaces/IWithdrawalRequest";

//verification api call

export const sendVerification = async (formData: FormData) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorSendVerificationRequest,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
    console.log("sendVerification request", response.data);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const getVerificationRequestByemail = async (email: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetVerificationStatus}/${email}`,
      {
        withCredentials: true,
      }
    );

    console.log("instructorVerification detail", response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

//profile management api call

export const instructorGetProfile = async () => {
  try {
    const response = await API.get(
      InstructorRouterEndPoints.instructorProfilePage,
      {
        withCredentials: true,
      }
    );

    console.log("instructor profile data response", response.data);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
  }
};

export const instructorUpdateProfile = async (
  formData: FormData
): Promise<any> => {
  try {
    const response = await API.put(
      InstructorRouterEndPoints.instructorUpdateProfile,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    console.log("instructor updateprofile response", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorUpdatePassword = async (data: any): Promise<any> => {
  try {
    const response = await API.put(
      InstructorRouterEndPoints.instructorUpdatePassword,data);
    console.log("instructor password updation data", response.data);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
  }
};

export const instructorUpdateBankDetail = async(data:any)=>{
  try {
    const response = await API.post(`${InstructorRouterEndPoints.instructorUpdateBankDetail}`,data)
    return response.data
  } catch (error) {
    throw error
  }
}

//FETCH CATEGORY

export const getInstructorCategories = async (): Promise<any[]> => {
  try {
    const response = await API.get("/api/instructor/categories", {
      withCredentials: true,
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

//course management actions

export const instructorCreateCourse = async (
  formData: FormData
): Promise<any> => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreateCourse,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update Course
export const instructorUpdateCourse = async (
  courseId: string,
  formData: FormData
): Promise<any> => {
  try {
    const response = await API.put(
      `${InstructorRouterEndPoints.instructorUpdateCourse}/${courseId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete Course
export const instructorDeleteCourse = async (
  courseId: string
): Promise<any> => {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteCourse}/${courseId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get Course By ID
export const instructorGetCourseById = async (
  courseId: string
): Promise<any> => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetCourseById}/${courseId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchInstructorCourses = async (
  params: FetchCoursesParams = {}
) => {
  try {
    const response = await API.get(
      InstructorRouterEndPoints.instructorGetCreatedCourses,
      {
        params, // ✅ pass page, limit, search as query params
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//chapter related actions

export const getChaptersByCourse = async (
  courseId: string,
  page = 1,
  limit = 10,
  search = ""
) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetChaptersByCourse}/${courseId}`,
      {
        params: { page, limit, search },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getChapterById = async (courseId: string, chapterId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetSingleChapter}/${courseId}/${chapterId}`
    );

    console.log("get chapter by id", response.data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createChapter = async (courseId: string, formData: FormData) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorCreateChapter}/${courseId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("create Chapter", response.data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateChapter = async (
  courseId: string,
  chapterId: string,
  formData: FormData
) => {
  try {
    const response = await API.put(
      `${InstructorRouterEndPoints.instructorUpdateChapter}/${courseId}/${chapterId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("update chapter", response.data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const deleteChapter = async (courseId: string, chapterId: string) => {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteChapter}/${courseId}/${chapterId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//quiz related actions

export const createQuiz = async (quizData: ICreateQuizPayload) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreateQuiz,
      quizData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Create Quiz:", response.data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const deleteQuiz = async (quizId: string) => {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteQuiz}/${quizId}`
    );
    console.log("Delete Quiz:", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getQuizById = async (quizId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetQuizById}/${quizId}`
    );
    console.log("Get Quiz By ID:", response.data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getQuizByCourseId = async (courseId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetQuizByCourseId}/${courseId}`
    );
    console.log("Get Quiz By Course ID:", response.data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getPaginatedQuestionsByCourseId = async (
  courseId: string,
  page: number = 1,
  limit: number = 10,
  search: string = ""
) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetQuizByCourseId}/${courseId}/paginated`,
      {
        params: { page, limit, search },
        withCredentials: true,
      }
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const addQuestionToQuiz = async (
  courseId: string,
  questionData: IQuestionPayload
) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorAddQuestion}/${courseId}/question`,
      questionData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateQuestionInQuiz = async (
  quizId: string,
  questionId: string,
  questionData: IQuestionPayload
) => {
  try {
    const response = await API.put(
      `${InstructorRouterEndPoints.instructorUpdateQuestion}/${quizId}/question/${questionId}`,
      questionData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const deleteQuestionFromQuiz = async (
  quizId: string,
  questionId: string
): Promise<{ message: string }> => {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteQuestion}/${quizId}/question/${questionId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const publishCourse = async (courseId: string) => {
  try {
    const response = await API.patch(
      `${InstructorRouterEndPoints.instructorPublishCourseById}/${courseId}/publish`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

//dashboard
export const getDashboard = async () => {
  try {
    const response = await API.get(
      InstructorRouterEndPoints.instructorGetDashboard
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getRevenueDashboard = async (
  range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  page: number,
  limit: number,
  startDate?: string,
  endDate?: string
) => {
  try {
    const queryParams = new URLSearchParams({
      range,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (range === "custom" && startDate && endDate) {
      queryParams.append("startDate", startDate);
      queryParams.append("endDate", endDate);
    }

    const endpoint = InstructorRouterEndPoints.instructorGetDashboardReport;
    const response = await API.get(`${endpoint}?${queryParams.toString()}`);
    return response.data; // Returns { success: true, data: any[], total: number }
  } catch (error) {
    throw error;
  }
};

export const exportRevenueReport = async (
  range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  format: "pdf" | "excel",
  startDate?: string,
  endDate?: string
): Promise<void> => {
  try {
    const params: Record<string, any> = { range, format };
    if (range === "custom") {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const response = await API.get(
      "/api/instructor/dashboard/reportRevenueExport",
      {
        params,
        responseType: "blob", // Important to handle file streams
      }
    );

    const filename =
      format === "excel"
        ? "Instructor_Revenue_Report.xlsx"
        : "Instructor_Revenue_Report.pdf";

    fileDownload(response.data, filename);
  } catch (error) {
    console.error("Failed to export report", error);
    throw error;
  }
};

export const specificCourseDashboard = async (courseId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorSpecificCourse}/${courseId}`
    );

    console.log('specific course', response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const specificCourseReport = async (
  courseId: string,
  range: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 5
) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('range', range);
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (range === 'custom') {
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
    }

    const response = await API.get(
      `${InstructorRouterEndPoints.instructorSpecificCourseReport}/${courseId}/revenueReport?${queryParams.toString()}`
    );

    console.log('specific course report response:', response); // Add logging

    return response; // Return full response instead of response.data
  } catch (error) {
    throw error;
  }
};

export const exportSpecificCourseReport = async (
  courseId: string,
  filter: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  startDate?: string,
  endDate?: string,
  format: 'pdf' | 'excel' = 'pdf'
): Promise<void> => {
  try {
    const params: Record<string, string> = {
      range: filter,
      format,
    };

    if (filter === 'custom' && startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const response = await API.get(
      `${InstructorRouterEndPoints.instructorExportSpecificCourseReport}/${courseId}/exportRevenueReport`,
      {
        params,
        responseType: 'blob',
      }
    );

    const filename =
      format === 'excel'
        ? 'Specific_Course_Revenue_Report.xlsx'
        : 'Specific_Course_Revenue_Report.pdf';

    fileDownload(response.data, filename);
  } catch (error) {
    console.error('Failed to export specific course report:', error);
    throw error;
  }
};



// wallet page

export const instructorGetWallet = async () => {
  try {
    const response = await API.get(
      InstructorRouterEndPoints.instructorGetWallet
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorCreditWallet = async (data: {
  amount: number;
  description: string;
  txnId: string;
}) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreditWallet,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Debit wallet
export const instructorDebitWallet = async (data: {
  amount: number;
  description: string;
  txnId: string;
}) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorDebitWallet,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Create Razorpay order for wallet recharge
export const instructorCreateWalletRechargeOrder = async (data: {
  amount: number;
}) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreateOrderForWalletCredit,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Verify Razorpay payment and credit wallet
export const instructorVerifyPayment = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorVerifyPayment,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorWalletTransactionHistory = async (
  page: number = 1,
  limit: number = 5
) => {
  try {
    const response = await API.get(
      InstructorRouterEndPoints.instructorGetTransactions,
      {
        params: { page, limit },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// instructor withdrawal request

export const instructorCreateWithdrawal = async(amount:number)=>{
  try {
    const response = await API.post(`${InstructorRouterEndPoints.instructorCreateWithdrawalRequest}`,{amount})
    return response.data
  } catch (error) {
    throw error
  }
}

export const instructorGetWithdrawal = async (
  page: number,
  limit: number
): Promise<{ transactions: IWithdrawalRequest[], currentPage: number, totalPages: number, total: number }> => {
  try {
    const response = await API.get(`${InstructorRouterEndPoints.instructorGetWithdrawalRequest}`, {
      params: { page, limit },
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const retryWithdrawal = async (requestId: string, amount?: number) => {
  try {
    const response = await API.patch(
      `${InstructorRouterEndPoints.instructorWithdrawalRetry}/${requestId}/retry`,
      { amount }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//membership
export const instructorViewMemberships = async () => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorViewMembership}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const isMentorOrNot = async () => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorMentorOrNot}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const membershipInitiateCheckout = async (planId: string) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorInitiateCheckout}/${planId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRazorpayOrder = async(planId:string)=>{
  try {
    const response = await API.post(`${InstructorRouterEndPoints.instructorCreateRazorpay}`,{planId})
    return response.data
  } catch (error) {
    throw error
  }
}

export const cancelOrder = async(orderId:string)=>{
  try {
    console.log('orderId',orderId)
    const response = await API.post(`${InstructorRouterEndPoints.instructorCancelOrder}`,{orderId})
    return response.data
  } catch (error) {
    throw error
  }
}

export const retryPayment = async(orderId:string)=>{
  try {
    const response = await API.post(`${InstructorRouterEndPoints.instructorRetryPayment}/${orderId}`)

    return response.data
  } catch (error) {
    throw error
  }
}

export const markOrderAsFailed = async (orderId: string) => {
  try {
    const response = await API.post(`${InstructorRouterEndPoints.instructorMarkAsFailed}`, {
      orderId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// 🔧 Update this function to accept payload
export const verifyMembershipPurchase = async (payload: {
  razorpayOrderId: string;
  paymentId: string;
  signature: string;
  planId: string;
}) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorVerifyMembership,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const retrieveActiveMembershipPlan = async () => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorCheckActiveMembership}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const purchaseMembershipWithWallet = async (planId: string) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorPurcahseMembershipWithWallet}/${planId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const membershipPurchaseHistory = async (page = 1, limit = 10, search="") => {
  try {
    const response = await API.get(
      InstructorRouterEndPoints.instructorMembershipPurchaseHistory,
      {
        params: { page, limit, search },
      }
    );
    console.log(response.data)
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const membershipDetail = async (orderId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorMembershipDetails}/${orderId}`
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadReceiptForMembership = async (orderId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorDownloadReceiptForMembership}/${orderId}/receipt`,
      {
        responseType: "blob",
      }
    );
    fileDownload(response.data, `Membership_Receipt_${orderId}.pdf`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSlot = async (payload: {
  startTime: Date | string;
  endTime: Date | string;
  price: number;
}) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreateSlot,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const listSlots = async () => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorListSlots}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSlot = async (
  slotId: string,
  payload: {
    startTime?: Date | string;
    endTime?: Date | string;
    price?: number;
  }
) => {
  try {
    const response = await API.put(
      `${InstructorRouterEndPoints.instructorUpdateSlot}/${slotId}`,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSlot = async (slotId: string) => {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteSlot}/${slotId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const slotHistory = async (
  mode: "monthly" | "yearly" | "custom",
  params: {
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
  }
) => {
  try {
    const queryParams = new URLSearchParams({
      mode,
      ...params,
    } as any).toString();
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorSlotHistory}?${queryParams}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const slotDetailsInInstructor = async(slotId:string)=>{
  try {
    const response = await API.get(`${InstructorRouterEndPoints.instructorSlotDetail}/${slotId}`)
    return response.data
  } catch (error) {
    throw error
  }
}