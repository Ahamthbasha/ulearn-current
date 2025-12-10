import { API } from "../../service/axios";

import AdminRoutersEndPoints from "../../types/endPoints/adminEndPoint";
import { type IMembershipPayload } from "../../types/interfaces/IMembershipPayload";
import { type ReportFilter } from "../../types/interfaces/IdashboardTypes";
import { type WithdrawalRequestDto, type WithdrawalRequestParams } from "../../types/interfaces/IWithdrawalRequest";
import fileDownload from "js-file-download";
import type { CouponData } from "../../types/interfaces/IAdminInterface";
import {  AxiosError } from "axios";

export const getAllUser = async (
  page = 1,
  limit = 1,
  search = ""
) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetUsers}?page=${page}&limit=${limit}&search=${search}`,
      );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const blockUser = async (email: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminBlockUser}/${email}`,
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllInstructor = async (
  page = 1,
  limit = 1,
  search = ""
)=> {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetInstructors}?page=${page}&limit=${limit}&search=${search}`,
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const blockInstructor = async (email: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminBlockInstructor}/${email}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllVerificationRequests = async (
  page = 1,
  limit = 1,
  search = ""
) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetVerifcationsRequest}?page=${page}&limit=${limit}&search=${search}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVerificationRequestByemail = async (email: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetVerificationByEamil}/${email}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateVerificationStatus = async (
  email: string,
  status: "approved" | "rejected",
  reason?: string
) => {
  try {
    const body: { email: string; status: string; reason?: string } = {
      email,
      status,
    };

    if (status === "rejected" && reason) {
      body.reason = reason;
    }

    const response = await API.post(
      AdminRoutersEndPoints.adminApproveVerification,
      body,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllCategories = async (
  page = 1,
  limit = 1,
  search = ""
) => {
  try {
    const response = await API.get(
      AdminRoutersEndPoints.adminGetAllCategories,
      {
        params: { page, limit, search },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (categoryId: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetCategoryById}/${categoryId}`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addCategory = async (categoryName: string) => {
  try {
    const response = await API.post(
      AdminRoutersEndPoints.adminCreateCategory,
      { categoryName },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const editCategory = async (
  id: string,
  categoryName: string
)=> {
  try {
    const response = await API.put(
      AdminRoutersEndPoints.adminEditCategory,
      { id, categoryName },
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const toggleCategoryStatus = async (id: string) => {
  try {
    const response = await API.put(
      `${AdminRoutersEndPoints.adminListOrUnListCategory}/${id}`,
      {},
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//course

export const getAllCourses = async (search = "", page = 1, limit = 10) => {
  try {
    const response = await API.get(`${AdminRoutersEndPoints.adminGetCourses}`, {
      params: { search, page, limit },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCourseDetails = async (courseId: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetCourseDetail}/${courseId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const listUnListCourse = async (courseId: string) => {
  try {
    const response = await API.patch(
      `${AdminRoutersEndPoints.adminToggleList}/${courseId}/listing`
    );

    console.log(response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyCourse = async ({
  courseId,
  status,
  review,
}: {
  courseId: string;
  status: "approved" | "rejected";
  review?: string;
}) => {
  try {
    const response = await API.patch(
      `${AdminRoutersEndPoints.adminVerifyCourse}/${courseId}/verifyCourse`,
      { status, review }
    );
    return response.data;
  } catch (error: unknown) {
    if(error instanceof Error){
      throw error
    }
  }
};

// wallet page

export const getWallet = async () => {
  try {
    const response = await API.get(AdminRoutersEndPoints.adminGetWallet);
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
    const response = await API.post(
      AdminRoutersEndPoints.adminCreditWallet,
      data
    );
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
    const response = await API.post(
      AdminRoutersEndPoints.adminDebitWallet,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ Create Razorpay order for wallet recharge
export const createWalletRechargeOrder = async (data: { amount: number }) => {
  try {
    const response = await API.post(
      AdminRoutersEndPoints.adminCreateOrderForWalletCredit,
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
      AdminRoutersEndPoints.adminVerifyPayment,
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const adminWalletTransactionHistory = async (
  page: number = 1,
  limit: number = 5
) => {
  try {
    const response = await API.get(
      AdminRoutersEndPoints.adminWalletTransactions,
      {
        params: { page, limit },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//admin withdrawal status change

export const adminGetAllWithdrawalRequests = async (
  page: number,
  limit: number,
  search?: string,
  status?: string
): Promise<{
  transactions: WithdrawalRequestDto[];
  currentPage: number;
  totalPages: number;
  total: number;
  search?: string;
  status?: string;
}> => {
  try {
    const params: WithdrawalRequestParams = { page, limit };

    // Add search parameter if provided
    if (search && search.trim()) {
      params.search = search.trim();
    }

    if (status && status.trim()) {
      params.status = status.trim();
    }

    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetAllWithdrawalRequests}`,
      {
        params,
      }
    );

    return response.data.data;
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(
        error.response?.data?.message || "Failed to fetch withdrawal requests"
      );
    }
    throw error
  }
};

export const adminGetWithdrawalRequestById = async (requestId: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetRequestDetails}/${requestId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const adminPendingWithdrawal = async () => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminWithdrawalPending}`
    );
    return response.data.data; // Extract the data array from the response
  } catch (error) {
    throw error;
  }
};

export const adminApproveWithdrawal = async (
  requestId: string,
  remarks?: string
) => {
  try {
    const response = await API.post(
      `${AdminRoutersEndPoints.adminWithdrawalApprove}`,
      {
        requestId,
        remarks,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const adminRejectWithdrawal = async (
  requestId: string,
  remarks?: string
) => {
  try {
    const response = await API.post(
      `${AdminRoutersEndPoints.adminWithdrawalReject}`,
      {
        requestId,
        remarks,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//membership

export const createMembership = async (payload: IMembershipPayload) => {
  try {
    const response = await API.post(
      AdminRoutersEndPoints.adminAddMembershipPlan,
      payload
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const editMembership = async (
  membershipId: string,
  payload: IMembershipPayload
) => {
  try {
    const response = await API.put(
      `${AdminRoutersEndPoints.adminEditMembershipPlan}/${membershipId}`,
      payload
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteMembership = async (membershipId: string) => {
  try {
    const response = await API.delete(
      `${AdminRoutersEndPoints.adminDeleteMembershipPlan}/${membershipId}`
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMembershipById = async (membershipId: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetMembershipPlanById}/${membershipId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllMembership = async (
  params: { page?: number; limit?: number; search?: string } = {}
) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetAllMembeshipPlan}`,
      {
        params,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const toggleMembershipStatus = async (membershipId: string) => {
  try {
    const response = await API.patch(
      `${AdminRoutersEndPoints.adminToggleMembershipPlan}/${membershipId}/toggleStatus`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMembershipPurchaseHistory = async (
  page: number,
  limit: number,
  search?: string,
  status?: string
) => {
  try {
    const params: Record<string, unknown> = { page, limit };
    if (search && search.trim() !== "") {
      params.search = search.trim();
    }
    if (status && status.trim() !== "" && ["paid", "failed","cancelled"].includes(status.trim())) {
      params.status = status.trim(); // Only allow "paid" or "failed"
    }

    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetMembershipPurchaseHistory}`,
      { params }
    );

    return response.data; // { data, total }
  } catch (error) {
    throw error;
  }
};

export const getMembershipPurchaseHistoryDetail = async (txnId: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminViewMembershipPuchaseHistoryDetail}/${txnId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

//dashboard

export const getDashboard = async () => {
  try {
    const response = await API.get(`${AdminRoutersEndPoints.adminDashboard}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCourseReport = async (
  filter: ReportFilter,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const params = new URLSearchParams();

    params.append("type", filter.type);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (filter.startDate) {
      params.append("startDate", filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params.append("endDate", filter.endDate.toISOString());
    }

    const response = await API.get(
      `${AdminRoutersEndPoints.adminCourseReport}?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMembershipCourseReport = async (
  filter: ReportFilter,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const params = new URLSearchParams();

    params.append("type", filter.type);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (filter.startDate) {
      params.append("startDate", filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params.append("endDate", filter.endDate.toISOString());
    }

    const response = await API.get(
      `${AdminRoutersEndPoints.adminMembershipReport}?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const exportReport = async (
  reportType: "course" | "membership",
  format: "excel" | "pdf",
  filter: ReportFilter
) => {
  try {
    const params = new URLSearchParams();
    params.append("type", filter.type);
    params.append("format", format);
    if (filter.startDate)
      params.append("startDate", filter.startDate.toISOString());
    if (filter.endDate) params.append("endDate", filter.endDate.toISOString());

    // Use the correct endpoint based on reportType
    const endpoint =
      reportType === "course"
        ? AdminRoutersEndPoints.adminExportReport
        : AdminRoutersEndPoints.adminExportMembershipReport;

    const response = await API.get(`${endpoint}?${params.toString()}`, {
      responseType: "blob", // Important for handling binary data (Excel/PDF)
    });

    const extension = format === "excel" ? "xlsx" : "pdf";
    const filename = `${reportType}-sales-report-${
      new Date().toISOString().split("T")[0]
    }.${extension}`;

    fileDownload(response.data, filename);

    return { success: true };
  } catch (error) {
    throw error;
  }
};


export const createCoupon = async (couponData: CouponData)=> {
  try {
    const response = await API.post(AdminRoutersEndPoints.adminCreateCoupon, couponData);
    return response.data
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(error.response?.data?.message || "Failed to create coupon");
    }
  }
};

export const getCoupon = async (page: number = 1, limit: number = 10,searchCode?:string) => {
  try {
    let url = `${AdminRoutersEndPoints.adminGetCoupons}?page=${page}&limit=${limit}`;
    if(searchCode && searchCode.trim()){
      url += `&search=${encodeURIComponent(searchCode.trim())}`
    }

    const response = await API.get(url)
    return response.data;
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(error.response?.data?.message || "Failed to fetch coupons");
    }
  }
};

export const getCouponById = async (couponId: string) => {
  try {
    const response = await API.get(`${AdminRoutersEndPoints.adminGetSpecificCoupon}/${couponId}`);
    return response.data;
  } catch (error) {
    
    if(error instanceof AxiosError)
      {
        throw new Error(error.response?.data?.message || "Failed to fetch coupon");
      }
  }
};

export const editCoupon = async (couponId: string, couponData: Partial<CouponData>) => {
  try {
    const response = await API.put(`${AdminRoutersEndPoints.adminEditCoupon}/${couponId}`, couponData);
    return response.data;
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(error.response?.data?.message || "Failed to update coupon");
    }
  }
};

export const deleteCoupon = async (couponId: string): Promise<void> => {
  try {
    const response = await API.delete(`${AdminRoutersEndPoints.adminDeleteCoupon}/${couponId}`);
    return response.data
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(error.response?.data?.message || "Failed to delete coupon");
    }
  }
};

export const getCouponByCode = async (code: string)=> {
  try {
    const response = await API.get(`${AdminRoutersEndPoints.adminGetCouponByCode}/${code}`);
    return response.data;
  } catch (error) {
    if(error instanceof AxiosError){
      throw new Error(error.response?.data?.message || "Failed to fetch coupon by code");
    }
  }
};

export const toggleStatus = async (couponId: string, status: boolean) => {
  try {
    const response = await API.patch(`${AdminRoutersEndPoints.adminModifyStatus}/${couponId}/status`, { status });
    return response.data;
  } catch (error) {
    if(error instanceof AxiosError){

      throw new Error(error.response?.data?.message || "Failed to toggle coupon status");
    }
  }
};

//course offer action

export const getCourseRequestList = async (page = 1, limit = 10, search?: string,status?:string) => {
  try {
   const res = await API.get(AdminRoutersEndPoints.adminGetAllCourseOfferRequest, { params: { page, limit, search,status } });
  return res.data; 
  } catch (error) {
    throw error
  }
};

export const getCourseOfferDetail = async (offerId: string) => {
  try {
    const res = await API.get(`${AdminRoutersEndPoints.adminGetCourseOfferDetail}/${offerId}`);
  return res.data;
  } catch (error) {
    throw error
  }
};

export const verifyCourseOfferRequest = async (payload: { offerId: string; status: "approved" | "rejected"; reviews?: string }) => {
  try {
    const res = await API.post(AdminRoutersEndPoints.adminVerifyCourseOffer, payload);
  return res.data;
  } catch (error) {
    throw error
  }
};

//course review management
export const getAdminCourseReviews = async (
  params: {
    courseId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }
) => {
  try {
    const response = await API.get(AdminRoutersEndPoints.adminGetAllReviews, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAdminCourseReview = async (reviewId: string) => {
  try {
    const response = await API.delete(`${AdminRoutersEndPoints.adminDeleteReview}/${reviewId}`);
  return response.data; 
  } catch (error) {
    throw error
  }
};

export const undeleteAdminCourseReview = async (reviewId: string) => {
  try {    
    const response = await API.patch(`${AdminRoutersEndPoints.adminUnDeleteReview}/${reviewId}/undelete`);
    return response.data;
  } catch (error) {
    throw error
  }
};

export const rejectAdminCourseReview = async (reviewId: string, reason: string) => {
  try {
    const response = await API.post(`${AdminRoutersEndPoints.adminRejectReview}/${reviewId}/reject`,{ reason });
    return response.data;
  } catch (error) {
    throw error
  }
};


export const approveAdminCourseReview = async (reviewId: string) => {
  try {
    const response = await API.patch(`${AdminRoutersEndPoints.adminApproveReview}/${reviewId}/approve`,);
    return response.data;
  } catch (error) {
    throw error
  }
};

export const getSpecificReviewById = async(reviewId:string)=>{
  try {
    const response = await API.get(`${AdminRoutersEndPoints.adminGetSpecificReview}/${reviewId}`)
    return response.data.data
  } catch (error) {
    throw error
  }
}