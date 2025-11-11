import InstructorRouterEndPoints from "../../types/endPoints/instructorEndPoint";
import fileDownload from "js-file-download";
import { API } from "../../service/axios";
import {
  type IQuestionPayload,
  // type ICreateQuizPayload,
} from "../../types/interfaces/IQuiz";

import { type FetchCoursesParams } from "../../types/interfaces/IFetchCoursesParam";
import type { IWithdrawalRequest } from "../../types/interfaces/IWithdrawalRequest";
import { AxiosError } from "axios";


export const sendVerification = async (formData: FormData) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorSendVerificationRequest,
      formData
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

export const getVerificationRequestByemail = async (email: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetVerificationStatus}/${email}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

//profile management api call

export const instructorGetProfile = async () => {
  try {
    const response = await API.get(
      InstructorRouterEndPoints.instructorProfilePage
    );
    return response.data;
  } catch (error) {
    if(error instanceof AxiosError){
      if (error.response && error.response.data) {
        return error.response.data;
      }
    }
  }
};

export const instructorUpdateProfile = async (
  formData: FormData
) => {
  try {
    const response = await API.put(
      InstructorRouterEndPoints.instructorUpdateProfile,
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorUpdatePassword = async ({currentPassword,newPassword}:{currentPassword:string,newPassword:string})=> {
  try {

    const response = await API.put(
      InstructorRouterEndPoints.instructorUpdatePassword,
      {currentPassword,newPassword}
    );
    return response.data;
  } catch (error) {
    if(error instanceof AxiosError){
      if (error.response && error.response.data) {
        return error.response.data;
      }
    }
  }
};

export const instructorUpdateBankDetail = async (data: {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorUpdateBankDetail}`,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//FETCH CATEGORY

export const getInstructorCategories = async () => {
  try {
    const response = await API.get("/api/instructor/categories");
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

//course management actions

export const instructorCreateCourse = async (
  formData: FormData
) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreateCourse,
      formData,
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
)=> {
  try {
    const response = await API.put(
      `${InstructorRouterEndPoints.instructorUpdateCourse}/${courseId}`,
      formData
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete Course
export const instructorDeleteCourse = async (
  courseId: string
)=> {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteCourse}/${courseId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get Course By ID
export const instructorGetCourseById = async (
  courseId: string
)=> {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetCourseById}/${courseId}`,
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
        params,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVerifiedCourses = async()=>{
  try {
    const response = await API.get(`${InstructorRouterEndPoints.GetVerifiedCourses}`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const submitCourseForVerification = async(courseId:string)=>{
  try {
    const response = await API.patch(`${InstructorRouterEndPoints.instructorSubmitVerificationForCourse}/${courseId}/submit`)
    return response.data
  } catch (error) {
    throw error
  }
}

//module related ACTIONS

export const getModulesByCourse = async (
  courseId: string,
  page = 1,
  limit = 10,
  search = ""
) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetModulesByCourse}/${courseId}/modules`,
      {
        params: { page, limit, search },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getModuleById = async (moduleId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetModuleById}/${moduleId}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createModule = async (moduleData: {
  courseId: string;
  moduleTitle: string;
  description: string;
}) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreateModule,
      moduleData
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateModule = async (
  moduleId: string,
  moduleData: {
    moduleTitle?: string;
    moduleNumber?: number;
    description?: string;
  }
) => {
  try {
    const response = await API.put(
      `${InstructorRouterEndPoints.instructorUpdateModule}/${moduleId}`,
      moduleData
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const deleteModule = async (moduleId: string) => {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteModule}/${moduleId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export const reorderModules = async(courseId:string,orderedIds:string[])=>{
  try {
    const response = await API.post(`${InstructorRouterEndPoints.instructorReorderModule}/${courseId}/modules/reorder`,{orderedIds})
    return response.data
  } catch (error) {
    throw error
  }
}

//chapter related code

export const getChaptersByModule = async (
  moduleId: string,
  page = 1,
  limit = 10,
  search = ""
) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetChaptersByModule}/${moduleId}/chapters`,
      {
        params: { page, limit, search },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getChapterById = async (chapterId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetSingleChapter}/${chapterId}`
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createChapter = async (formData: FormData) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreateChapter,
      formData
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateChapter = async (
  chapterId: string,
  formData: FormData
) => {
  try {
    const response = await API.put(
      `${InstructorRouterEndPoints.instructorUpdateChapter}/${chapterId}`,
      formData
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const deleteChapter = async (chapterId: string) => {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteChapter}/${chapterId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const reorderChapters = async (moduleId: string, orderedIds: string[]) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorReorderChapter}/${moduleId}/chapters/reorder`,
      { orderedIds }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//quiz related code

export const createQuiz = async (moduleId: string) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorCreateQuiz}/${moduleId}/quiz`,
      { moduleId }
    );
    return response.data.data;
  } catch (error) {
    throw error
  }
};

// GET QUIZ BY MODULE ID
export const getQuizByModuleId = async (moduleId: string) => {
  try {
    const response = await API.get(
    `${InstructorRouterEndPoints.instructorGetQuizByModuleId}/${moduleId}/quiz`
  );
  return response.data.data; 
  } catch (error) {
    throw error
  }
};

// DELETE QUIZ
export const deleteQuiz = async (quizId: string) => {
  try {
    const response = await API.delete(`${InstructorRouterEndPoints.instructorDeleteQuiz}/${quizId}`);
    return response.data;
  } catch (error) {
    throw error
  }
};

// GET QUIZ BY ID
export const getQuizById = async (quizId: string) => {
  try {
    const response = await API.get(`${InstructorRouterEndPoints.instructorGetQuizById}/${quizId}`);
    return response.data.data;
  } catch (error) {
    throw error
  }
};

// ADD QUESTION TO QUIZ (via moduleId)
export const addQuestionToQuiz = async (
  moduleId: string,
  questionData: IQuestionPayload
) => {
  try {
  const response = await API.post
  (`${InstructorRouterEndPoints.instructorAddQuestion}/${moduleId}/quiz/questions`,questionData)
  return response.data.data;
} catch (error) {
  throw error
}
};

// UPDATE QUESTION
export const updateQuestionInQuiz = async (
  quizId: string,
  questionId: string,
  questionData: IQuestionPayload
) => {try {
  const response = await API.patch(`${InstructorRouterEndPoints.instructorUpdateQuestion}/${quizId}/questions/${questionId}`,
    questionData
  );
  return response.data.data;
} catch (error) {
  throw error
}
};

// DELETE QUESTION
export const deleteQuestionFromQuiz = async (
  quizId: string,
  questionId: string
) => {
  try 
  {
  const response = await API.delete(`${InstructorRouterEndPoints.instructorDeleteQuestion}/${quizId}/questions/${questionId}`
  );
  return response.data;
} catch (error) {
  throw error
}
};

// GET PAGINATED QUESTIONS BY MODULE ID
export const getPaginatedQuestionsByModuleId = async (
  moduleId: string,
  page: number = 1,
  limit: number = 10,
  search: string = ""
) => {
  const response = await API.get(
    `${InstructorRouterEndPoints.instructorGetPaginatedQuestions}/${moduleId}/quiz/questions`,
    {
      params: { page, limit, search },
    }
  );
  return response.data.data 
};

export const publishCourse = async (courseId: string, publishDate?: string) => {
  try {
    const response = await API.patch(
      `${InstructorRouterEndPoints.instructorPublishCourseById}/${courseId}/publish`,
      publishDate ? { publishDate } : {}
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
    return response.data; 
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
    const params: Record<string, unknown> = { range, format };
    if (range === "custom") {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const response = await API.get(
      "/api/instructor/dashboard/reportRevenueExport",
      {
        params,
        responseType: "blob",
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
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const specificCourseReport = async (
  courseId: string,
  range: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 5
) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("range", range);
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (range === "custom") {
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
    }

    const response = await API.get(
      `${
        InstructorRouterEndPoints.instructorSpecificCourseReport
      }/${courseId}/revenueReport?${queryParams.toString()}`
    );
    return response;
  } catch (error) {
    throw error;
  }
};

export const exportSpecificCourseReport = async (
  courseId: string,
  filter: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  startDate?: string,
  endDate?: string,
  format: "pdf" | "excel" = "pdf"
): Promise<void> => {
  try {
    const params: Record<string, string> = {
      range: filter,
      format,
    };

    if (filter === "custom" && startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const response = await API.get(
      `${InstructorRouterEndPoints.instructorExportSpecificCourseReport}/${courseId}/exportRevenueReport`,
      {
        params,
        responseType: "blob",
      }
    );

    const filename =
      format === "excel"
        ? "Specific_Course_Revenue_Report.xlsx"
        : "Specific_Course_Revenue_Report.pdf";

    fileDownload(response.data, filename);
  } catch (error) {
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

export const instructorCreateWithdrawal = async (amount: number) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorCreateWithdrawalRequest}`,
      { amount }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorGetWithdrawal = async (
  page: number,
  limit: number
): Promise<{
  transactions: IWithdrawalRequest[];
  currentPage: number;
  totalPages: number;
  total: number;
}> => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorGetWithdrawalRequest}`,
      {
        params: { page, limit },
      }
    );
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

export const createRazorpayOrder = async (planId: string) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorCreateRazorpay}`,
      { planId }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelOrder = async (orderId: string) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorCancelOrder}`,
      { orderId }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const retryPayment = async (orderId: string) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorRetryPayment}/${orderId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markOrderAsFailed = async (orderId: string) => {
  try {
    const response = await API.post(
      `${InstructorRouterEndPoints.instructorMarkAsFailed}`,
      {
        orderId,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

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

export const membershipPurchaseHistory = async (
  page = 1,
  limit = 10,
  search = ""
) => {
  try {
    const response = await API.get(
      InstructorRouterEndPoints.instructorMembershipPurchaseHistory,
      {
        params: { page, limit, search },
      }
    );
    console.log(response.data);
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

// slots managment //

export const createSlot = async (data: {
  startTime?: Date | string;
  endTime?: Date | string;
  price?: number;
  recurrenceRule?: {
    daysOfWeek: number[];
    startDate: Date | string;
    endDate: Date | string;
  };
}) => {
  try {
    const response = await API.post(
      InstructorRouterEndPoints.instructorCreateSlot,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const listSlots = async (date?: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorListSlots}${date ? `?date=${date}` : ""}`
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

export const deleteUnbookedSlotsForDate = async (date: string) => {
  try {
    const response = await API.delete(
      `${InstructorRouterEndPoints.instructorDeleteSlotBasedOnDate}`,
      { params: { date } }
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
    // Build an object with string values only for URLSearchParams
    const queryObject: Record<string, string> = { mode };
    if (params.month !== undefined) queryObject.month = params.month.toString();
    if (params.year !== undefined) queryObject.year = params.year.toString();
    if (params.startDate) queryObject.startDate = params.startDate;
    if (params.endDate) queryObject.endDate = params.endDate;

    const queryParams = new URLSearchParams(queryObject).toString();

    const response = await API.get(
      `${InstructorRouterEndPoints.instructorSlotHistory}?${queryParams}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const slotDetailsInInstructor = async (slotId: string) => {
  try {
    const response = await API.get(
      `${InstructorRouterEndPoints.instructorSlotDetail}/${slotId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//course offer management
export const getPublishedCourses = async () => {
  try {
    const response = await API.get(
    InstructorRouterEndPoints.instructorGetCreatedCourses
  );
  return response.data; 
  } catch (error) {
    throw error
  }
};

export const getInstructorCourseOffers = async (
  page = 1,
  limit = 10,
  search?: string,
  status?:string,
) => {

  try {
    const response = await API.get(InstructorRouterEndPoints.instructorGetCourseOffers , {
      params: { page, limit, search, status },
    });
    return response.data;
  } catch (error) {
    throw error
  }
};

export const createInstructorCourseOffer = async (
  courseId: string,
  discountPercentage: number,
  startDate: Date,
  endDate: Date
) => {
  try {
    const response = await API.post(InstructorRouterEndPoints.instructorCreateCourseOffer, {
      courseId,
      discountPercentage,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return response.data;
  } catch (error) {
    throw error
  }
};

export const editInstructorCourseOffer = async (
  offerId: string,
  discountPercentage: number,
  startDate: Date,
  endDate: Date
) => {
  const response = await API.put(InstructorRouterEndPoints.instructorEditCourseOffer, {
    offerId,
    discountPercentage,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  return response.data;
};

export const resubmitInstructorCourseOffer = async (
  offerId: string,
  discountPercentage: number,
  startDate: Date,
  endDate: Date
) => {
  const response = await API.post(InstructorRouterEndPoints.instructorResubmitCourseOffer, {
    offerId,
    discountPercentage,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  return response.data;
};

export const getInstructorCourseOfferById = async (offerId: string) => {
  try {
    const response = await API.get(`${InstructorRouterEndPoints.instructorGetSpecificOfferById}/${offerId}`);
    return response.data.data;
  } catch (error) {
    throw error
  }
};

export const deleteInstructorCourseOffer = async (offerId: string) => {
  try {
    const response = await API.delete(`${InstructorRouterEndPoints.instructorDeleteSpecificOffer}/${offerId}`);
    return response.data
  } catch (error) {
    throw error
  }
};
