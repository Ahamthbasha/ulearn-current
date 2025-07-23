import { API } from "../../service/axios";

import AdminRoutersEndPoints from "../../types/endPoints/adminEndPoint";
import { type IMembershipPayload } from "../../types/interfaces/IMembershipPayload";

export const getAllUser = async (
  page = 1,
  limit = 1,
  search = ""
): Promise<any> => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetUsers}?page=${page}&limit=${limit}&search=${search}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    console.log("API Call Params =>", { page, limit, search });

    console.log("getAll users in adminAction api", response.data);
    return response.data; // contains {users, total}
  } catch (error) {
    throw error;
  }
};

export const blockUser = async (email: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminBlockUser}/${email}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    console.log("block user in adminAction", response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllInstructor = async (
  page = 1,
  limit = 1,
  search = ""
): Promise<any> => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetInstructors}?page=${page}&limit=${limit}&search=${search}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    console.log("Instructor API Call Params =>", { page, limit, search });

    console.log("getall instructors", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const blockInstructor = async (email: string): Promise<any> => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminBlockInstructor}/${email}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    console.log("block instructor", response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllVerificationRequests = async (
  page = 1,
  limit = 1,
  search = ""
): Promise<any> => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetVerifcationsRequest}?page=${page}&limit=${limit}&search=${search}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    console.log("Verification API Call Params =>", { page, limit, search });
    console.log("Verification request response =>", response.data);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVerificationRequestByemail = async (email: string) => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetVerificationByEamil}/${email}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    console.log(
      "getspecific verification request in adminAction api",
      response.data
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateVerificationStatus = async (
  email: string,
  status: "approved" | "rejected",
  reason?: string // ✅ Add this optional field
) => {
  try {
    const body: { email: string; status: string; reason?: string } = {
      email,
      status,
    };

    if (status === "rejected" && reason) {
      body.reason = reason; // ✅ Attach reason only for rejected status
    }

    const response = await API.post(
      AdminRoutersEndPoints.adminApproveVerification,
      body,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    console.log("approved/rejected request", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllCategories = async (
  page = 1,
  limit = 1,
  search = ""
): Promise<any> => {
  try {
    const response = await API.get(
      AdminRoutersEndPoints.adminGetAllCategories,
      {
        params: { page, limit, search },
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCategoryById = async (categoryId: string): Promise<any> => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetCategoryById}/${categoryId}`,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    console.log("Fetched category by ID:", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addCategory = async (categoryName: string): Promise<any> => {
  try {
    const response = await API.post(
      AdminRoutersEndPoints.adminCreateCategory,
      { categoryName },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    console.log("Category added:", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const editCategory = async (
  id: string,
  categoryName: string
): Promise<any> => {
  try {
    const response = await API.put(
      AdminRoutersEndPoints.adminEditCategory,
      { id, categoryName },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    console.log("Category edited:", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const toggleCategoryStatus = async (id: string): Promise<any> => {
  try {
    const response = await API.put(
      `${AdminRoutersEndPoints.adminListOrUnListCategory}/${id}`,
      {},
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    console.log("Toggled category listing:", response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

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

// wallet page

export const getWallet = async () => {
  try {
    const response = await API.get(AdminRoutersEndPoints.adminGetWallet);
    console.log("wallet", getWallet);
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

export const getMembershipPurchaseHistory = async () => {
  try {
    const response = await API.get(
      `${AdminRoutersEndPoints.adminGetMembershipPurchaseHistory}`
    );

    return response.data;
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
