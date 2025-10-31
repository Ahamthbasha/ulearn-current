import { AxiosError } from "axios";
import type { LearningPathFilterResponse } from "../../pages/student/interface/studentInterface";
import { API } from "../../service/axios";
import UserRouterEndpoints from "../../types/endPoints/userEndPoint";
import type QuizPayload from "../../types/interfaces/IQuizPayload";
import type { GetLMSCoursesParams, CartItemDTO, WishlistItem, LearningPathListDTO, LearningPathDTO, CreateLearningPathRequest, UpdateLearningPathRequest, ExportCourseReportFilter, ExportCourseReportParams, ExportSlotReportFilter, ExportSlotReportParams } from "../../types/interfaces/IStudentInterface";
import type { ListInstructorParams, RetryPaymentResponse } from "../../types/interfaces/ListInstructorParams";
import fileDownload from "js-file-download";

export const getProfile = async () => {
  try {
    const response = await API.get(UserRouterEndpoints.userProfilePage);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (formData: FormData) => {
  try {
    const response = await API.put(
      UserRouterEndpoints.userProfilePage,
      formData
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (data: FormData)=> {
  try {
    const response = await API.put(
      UserRouterEndpoints.userUpdatePassWord,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const allCourses = async () => {
  try {
    const response = await API.get(UserRouterEndpoints.userCourseList);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const courseDetail = async (courseId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userCourseDetail}/${courseId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// StudentAction.ts
export const CoursesFiltered = async (
  page = 1,
  limit = 8,
  search = "",
  sort = "name-asc",
  categoryId?: string
) => {
  try {
    const response = await API.get(UserRouterEndpoints.userCourseFilter, {
      params: {
        page,
        limit,
        search,
        sort,
        category: categoryId,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllCategories = async () => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetAllCategories);
    return response.data.data; 
  } catch (error) {
    throw error;
  }
};

//cart actions

export const getCart = async () : Promise<CartItemDTO[]>=> {
  try {
    const response = await API.get<{ success: boolean; message: string; data: CartItemDTO[] }>(UserRouterEndpoints.userGetCart);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const addToCart = async (itemId: string,type:"course" | "learningPath"):Promise<CartItemDTO> => {
  try {
    if (!["course", "learningPath"].includes(type)) {
      throw new Error("Invalid item type");
    }
    const response = await API.post(UserRouterEndpoints.userAddToCart, {
      itemId,
      type
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeFromCart = async (itemId: string,type:"course"|"learningPath") : Promise<CartItemDTO[]> => {
  try {
    if (!["course", "learningPath"].includes(type)) {
      throw new Error("Invalid item type");
    }
    const response = await API.delete<{success: boolean; message: string; data: CartItemDTO[]}>(
      `${UserRouterEndpoints.userRemoveCourseFromCart}/${itemId}?type=${type}`
    );
    return response.data.data
  } catch (error) {
    throw error;
  }
};

export const clearCart = async () => {
  try {
    const response = await API.delete(UserRouterEndpoints.userClearCart);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//wishlist actions

export const getWishlist = async (): Promise<{
  success: boolean;
  message: string;
  data: WishlistItem[];
}> => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetWishlistItems);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addToWishlist = async (
  itemId: string,
  type: "course" | "learningPath"
) => {
  try {
    const response = await API.post(UserRouterEndpoints.userAddToWishlist, {
      itemId,
      type,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeFromWishlist = async (
  itemId: string,
  type: "course" | "learningPath"
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await API.delete(
      `${UserRouterEndpoints.userRemoveFromWishlist}/${itemId}?type=${type}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const isItemInWishlist = async (
  itemId: string,
  type: "course" | "learningPath"
): Promise<{
  success: boolean;
  exists: boolean;
}> => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userIsItemInWishlist}/${itemId}?type=${type}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//coupon action

export const getAllCoupons = async()=>{
  try {
    const response = await API.get(`${UserRouterEndpoints.userShowAllCoupon}`)

    return response.data
  } catch (error) {
    throw error
  }
}

//checkout actions

export const initiateCheckout = async (
  courseIds: string[],
  learningPathIds:string[],
  totalAmount: number,
  paymentMethod: "razorpay" | "wallet",
  couponId?:string
) => {
  try {
    const response = await API.post(UserRouterEndpoints.userInitiateCheckout, {
      courseIds,
      learningPathIds,
      totalAmount,
      paymentMethod,
      couponId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkoutCompleted = async ({
  orderId,
  paymentId,
  method,
  amount,
}: {
  orderId: string;
  paymentId: string;
  method: string;
  amount: number;
}) => {
  try {
    const response = await API.post(UserRouterEndpoints.userCompleteCheckout, {
      orderId,
      paymentId,
      method,
      amount,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelPendingOrder = async(orderId:string)=>{
  try {
    const response = await API.post(UserRouterEndpoints.userCancelPendingOrder,{orderId})
    return response.data
  } catch (error) {
    throw error
  }
}

export const markFailed = async(orderId:string)=>{
  try {
    const response = await API.post(UserRouterEndpoints.userMarkFailed,{orderId})
    return response.data
  } catch (error) {
    throw error
  }
}

//boughted courses actions

export const getEnrolledCourses = async () => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetEnrolledCourses);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSpecificCourse = async (courseId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userGetSpecificEnrolledCourses}/${courseId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const markChapterAsCompleted = async (
  courseId: string,
  chapterId: string
) => {
  try {
    const response = await API.patch("/api/student/enrolled/completeChapter", {
      courseId,
      chapterId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitQuiz = async (payload: QuizPayload) => {
  try {
    const response = await API.post(
      UserRouterEndpoints.userSubmitQuiz,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkChapterCompletedOrNot = async (courseId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userCheckAllChapterCompleted}/${courseId}/allChaptersComplete`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCertificate = async (courseId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userGetCertificate}/${courseId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

// wallet page

export const getWallet = async () => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetWallet);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const creditWallet = async (data: {
  amount: number;
  description: string;
  txnId: string;
}) => {
  try {
    const response = await API.post(UserRouterEndpoints.userCreditWallet, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const debitWallet = async (data: {
  amount: number;
  description: string;
  txnId: string;
}) => {
  try {
    const response = await API.post(UserRouterEndpoints.userDebitWallet, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createWalletRechargeOrder = async (data: { amount: number }) => {
  try {
    const response = await API.post(
      UserRouterEndpoints.userCreateOrderForWalletCredit,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyPayment = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
}) => {
  try {
    const response = await API.post(
      UserRouterEndpoints.userVerifyPayment,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const walletTransactionHistory = async (
  page: number = 1,
  limit: number = 5
) => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetTransactions, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const allOrder = async (
  page: number = 1,
  limit: number = 5,
  search: string = ""
) => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetOrders, {
      params: { page, limit, search },
    });
    return response.data; // should return { orders, total }
  } catch (error) {
    throw error;
  }
};

export const orderDetail = async (orderId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userGetOrderDetail}/${orderId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadInvoice = async (orderId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userDownloadOrderInvoice}/${orderId}/invoice`,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error;
  }
};

export const retryPayment = async (
  orderId: string,
  paymentData?: { paymentId: string; method: string; amount: number,retryAttemptId?:string },
): Promise<RetryPaymentResponse> => {
  const response = await API.post(
    `/api/student/orders/${orderId}/retry`,
    paymentData || {},
  );
  return response.data;
};

export const MarkCourseOrderAsFailed = async(orderId:string)=>{
  try {
    const response = await API.post(`${UserRouterEndpoints.userMarkOrderFailed}/${orderId}/markFailed`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const listInstructors = async (params: ListInstructorParams) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const response = await API.get(
      `${UserRouterEndpoints.userSideInstructorLists}?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const instructorDetailsById = async (instructorId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userSideInstructorDetailsById}/${instructorId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSkillAndExpertise = async () => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userGetSkillsAndExpertise}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSlotsOfParticularInstructor = async (instructorId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userViewSlotsParticularInstructor}/${instructorId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const slotCheckout = async (slotId: string) => {
  try {
    const response = await API.post(
      `${UserRouterEndpoints.userSlotInitiateCheckout}/${slotId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifySlotPayment = async (
  slotId: string,
  razorpay_payment_id: string
) => {
  try {
    const response = await API.post(
      `${UserRouterEndpoints.userSlotVerifyPayment}`,
      {
        slotId,
        razorpay_payment_id,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bookSlotViaWallet = async (slotId: string) => {
  try {
    const response = await API.post(
      `${UserRouterEndpoints.userBookSlotViaWallet}/${slotId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkSlotAvailabilityApi = async (slotId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userCheckSlotStatus}/${slotId}/availability`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelPendingBookingApi = async (bookingId: string) => {
  try {
    const response = await API.post(
      `${UserRouterEndpoints.userCancelPendingBooking}/${bookingId}/cancel`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const handlePaymentFailureApi = async (bookingId: string) => {
  try {
    const response = await API.post(
      `${UserRouterEndpoints.userCancelPendingBooking}/${bookingId}/paymentFailed`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const retrySlotPayment = async(bookingId:string)=>{
  try {
    const response = await API.post(`${UserRouterEndpoints.userRetrySlotPayment}/${bookingId}/retryPayment`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const verifyRetrySlotPayment = async (
  bookingId: string,
  razorpay_payment_id: string
) => {
  try {
    const response = await API.post(
      `${UserRouterEndpoints.userVerifySlotRetryPayment}`,
      {
        bookingId,
        razorpay_payment_id,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bookingHistory = async (page = 1, limit = 5, searchQuery = "") => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchQuery && searchQuery.trim()) {
      params.append("search", searchQuery.trim());
    }

    const response = await API.get(
      `${UserRouterEndpoints.userGetSlotBookingHistory}?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const bookingDetail = async (bookingId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userGetSpecificSlotDetail}/${bookingId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const slotReceipt = async (bookingId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userDownloadSlotReceipt}/${bookingId}/receipt`,
      { responseType: "blob" }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


//dashboard

export const dashboard = async () => {
  try {
    const response = await API.get(`${UserRouterEndpoints.userDashboard}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const courseReport = async (filter: {
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  startDate?: string;
  endDate?: string;
  page?: number;
}) => {
  try {
    const response = await API.get(`${UserRouterEndpoints.userCourseReport}`, {
      params: {
        filter: filter.type,
        startDate: filter.startDate,
        endDate: filter.endDate,
        page: filter.page,
        limit: 5,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const slotReport = async (filter: {
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  startDate?: string;
  endDate?: string;
  page?: number;
}) => {
  try {
    const response = await API.get(`${UserRouterEndpoints.userSlotReport}`, {
      params: {
        filter: filter.type,
        startDate: filter.startDate,
        endDate: filter.endDate,
        page: filter.page,
        limit: 5,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const exportCourseReport = async (
  format: "pdf" | "excel",
  filter?: ExportCourseReportFilter,
  customStartDate?: string,
  customEndDate?: string
) => {
  try {
    const params: ExportCourseReportParams = {
      format,
      filter: filter?.type || "custom",
      page: filter?.page,
      limit: 5,
    };

    if (
      filter?.type === "custom" &&
      customStartDate !== undefined &&
      customEndDate !== undefined
    ) {
      params.startDate = new Date(customStartDate).toISOString().split("T")[0];
      params.endDate = new Date(customEndDate).toISOString().split("T")[0];
    }

    const response = await API.get(UserRouterEndpoints.userExportCourseReport, {
      params,
      responseType: "blob",
    });

    const filename = format === "pdf" ? "course-report.pdf" : "course-report.xlsx";
    const blob = new Blob([response.data], {
      type:
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fileDownload(blob, filename);
  } catch (error) {
    console.error("Error exporting course report:", error);
    throw error;
  }
};


export const exportSlotReport = async (
  format: "pdf" | "excel",
  filter?: ExportSlotReportFilter,
  customStartDate?: string,
  customEndDate?: string
) => {
  try {
    const params: ExportSlotReportParams = {
      format,
      filter: filter?.type || "custom",
      page: filter?.page,
      limit: 5,
    };

    if (
      filter?.type === "custom" &&
      customStartDate !== undefined &&
      customEndDate !== undefined
    ) {
      params.startDate = new Date(customStartDate).toISOString().split("T")[0];
      params.endDate = new Date(customEndDate).toISOString().split("T")[0];
    }

    const response = await API.get(UserRouterEndpoints.userExportSlotReport, {
      params,
      responseType: "blob",
    });

    const filename = format === "pdf" ? "slot-report.pdf" : "slot-report.xlsx";
    const blob = new Blob([response.data], {
      type:
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fileDownload(blob, filename);
  } catch (error) {
    console.error("Error exporting slot report:", error);
    throw error;
  }
};

// lms //

export const GetLMSCourses = async (params: GetLMSCoursesParams = {}): Promise<LearningPathFilterResponse> => {
  try {
    const { query = "", page = 1, limit = 10, category = "", sort = "name-asc" } = params;
    
    const queryParams = new URLSearchParams({
      query,
      page: page.toString(),
      limit: limit.toString(),
      category,
      sort,
    }).toString();

    const response = await API.get(`${UserRouterEndpoints.userGetLMSCourse}?${queryParams}`);
    return response.data as LearningPathFilterResponse;
  } catch (error) {
    throw error;
  }
};

export const GetLmsCourseDetail = async(learningPathId:string)=>{
  try {
    const response = await API.get(`${UserRouterEndpoints.userGetLMSCourseDetail}/${learningPathId}`)
    return response.data
  } catch (error) {
    throw error
  }
}

// enrolled lms

export const getEnrolledLearningPaths = async()=>{
  try {
    const response = await API.get(`${UserRouterEndpoints.userGetAllEnrollments}`)
    return response.data.data
  } catch (error) {
    throw error
  }
}


export const getLearningPathDetails = async(learningPathId:string)=>{
  try {
   const response = await API.get(`${UserRouterEndpoints.userGetSpecificLmsEnrollments}/${learningPathId}`)
   return response.data.data 
  } catch (error) {
    throw error
  }
}

export const completeCourseAndUnlockNext = async(courseId:string,learningPathId:string)=>{
  try {
    const response = await API.post(`${UserRouterEndpoints.userCompleteCourseAndUnlockNext}`,{
      learningPathId,
      courseId
    })
    return response.data.data
  } catch (error) {
    throw error
  }
}


export const getLearningPathCertificate = async(learningPathId:string)=>{
  try {
    const response = await API.get(`${UserRouterEndpoints.userGetSpecificLmsEnrollments}/${learningPathId}/certificate`)
    return response.data.data
  } catch (error) {
    throw error
  }
}





















// learning path

export const getAllCourses = async(categoryId?:string|null)=>{
  try {
    const response = await API.get(`${UserRouterEndpoints.userGetAllCourse}${categoryId?`?category=${encodeURIComponent(categoryId)}` : ''}`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const getStudentLearningPaths = async (
  page: number = 1,
  limit: number = 10,
  search: string = ""
): Promise<{ data: LearningPathListDTO[]; total: number }> => {
  try {
    const response = await API.get(
      `${
        UserRouterEndpoints.userGetLearningPaths
      }?page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`
    );
    return {
      data: response.data.data || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(
        error.response?.data?.message || "Failed to fetch learning paths"
      );
    }
    throw error
  }
};

export const getLearningPathById = async (
  learningPathId: string
): Promise<LearningPathDTO> => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userGetLearningPathById}/${learningPathId}`
    );
    return response.data.data;
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(
        error.response?.data?.message || "Failed to fetch learning path"
      );
    }
    throw error
  }
};

export const createLearningPath = async (
  data: CreateLearningPathRequest,
  thumbnail?: File
): Promise<LearningPathDTO> => {
  try {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("category",data.category)
    formData.append("items", JSON.stringify(data.items));
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    const response = await API.post(
      UserRouterEndpoints.userCreateLearningPath,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data.data;
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(
        error.response?.data?.message || "Failed to create learning path"
      );
    }
    throw error
  }
};

export const updateLearningPath = async (
  learningPathId: string,
  data: UpdateLearningPathRequest,
  thumbnail?: File
): Promise<LearningPathDTO> => {
  try {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.items) formData.append("items", JSON.stringify(data.items));
    if (data.category) formData.append("category",data.category)
    if (thumbnail) formData.append("thumbnail", thumbnail);
    const response = await API.put(
      `${UserRouterEndpoints.userUpdateLearningPath}/${learningPathId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data.data;
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(
        error.response?.data?.message || "Failed to update learning path"
      );
    }
    throw error
  }
};

export const deleteLearningPath = async (
  learningPathId: string
): Promise<void> => {
  try {
    await API.delete(
      `${UserRouterEndpoints.userDeleteLearningPath}/${learningPathId}`
    );
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(
        error.response?.data?.message || "Failed to delete learning path"
      );
    }
  }
};

