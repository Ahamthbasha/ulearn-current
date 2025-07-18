import { API } from "../../service/axios";
import UserRouterEndpoints from "../../types/endPoints/userEndPoint";
import type QuizPayload from "../../types/interfaces/IQuizPayload";
import type { ListInstructorParams } from "../../types/interfaces/ListInstructorParams";

export const getProfile = async () => {
  try {
    const response = await API.get(UserRouterEndpoints.userProfilePage, {
      withCredentials: true,
    });

    console.log("profile data response", response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (formData: FormData): Promise<any> => {
  try {
    const response = await API.put(
      UserRouterEndpoints.userProfilePage,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      }
    );

    console.log("updateprofile response", response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (data: any): Promise<any> => {
  try {
    const response = await API.put(
      UserRouterEndpoints.userUpdatePassWord,
      data,
      {
        withCredentials: true,
      }
    );

    console.log("password updation data", response.data);

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
    return response.data.data; // Adjust depending on your response shape
  } catch (error) {
    throw error;
  }
};

//cart actions

export const getCart = async () => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetCart);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addToCart = async (courseId: string) => {
  try {
    const response = await API.post(UserRouterEndpoints.userAddToCart, {
      courseId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeFromCart = async (courseId: string) => {
  try {
    const response = await API.delete(
      `${UserRouterEndpoints.userRemoveCourseFromCart}/${courseId}`
    );
    return response.data;
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

export const getWishlist = async () => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetWishlist);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addToWishlist = async (courseId: string) => {
  try {
    const response = await API.post(
      UserRouterEndpoints.userAddTowishlist,
      {
        courseId,
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeFromWishlist = async (courseId: string) => {
  try {
    const response = await API.delete(
      `${UserRouterEndpoints.userRemoveWishlist}/${courseId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const courseAlreadyExistInWishlist = async (courseId: string) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userCheckCourseExistInWishlist}/${courseId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//checkout actions

export const initiateCheckout = async (
  courseIds: string[],
  totalAmount: number,
  paymentMethod: "razorpay" | "wallet" // ✅ Add this
) => {
  try {
    const response = await API.post(UserRouterEndpoints.userInitiateCheckout, {
      courseIds,
      totalAmount,
      paymentMethod, // ✅ Send this to backend
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

// ✅ Debit wallet
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

// ✅ Create Razorpay order for wallet recharge
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

// ✅ Verify Razorpay payment and credit wallet
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

export const allOrder = async (page: number = 1, limit: number = 5) => {
  try {
    const response = await API.get(UserRouterEndpoints.userGetOrders, {
      params: { page, limit },
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
        responseType: "blob", // 👈 VERY important for downloading files
      }
    );

    // ✅ Trigger file download in browser
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url); // cleanup
  } catch (error) {
    throw error;
  }
};

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

export const bookingHistory = async (page = 1, limit = 5) => {
  try {
    const response = await API.get(
      `${UserRouterEndpoints.userGetSlotBookingHistory}?page=${page}&limit=${limit}`
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
