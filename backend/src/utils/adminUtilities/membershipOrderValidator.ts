import {
  MEMBERSHIP_ORDER_ERROR_MESSAGE,
  VALID_ORDER_STATUSES,
} from "../constants";

export interface PaginationParams {
  page?: number;
  limit?: number;
}
export interface ListOrderParams extends PaginationParams {
  search?: string;
  status?: string;
}
export interface DetailOrderParams {
  razorpayOrderId?: string;
}

export class MembershipOrderValidator {
  static validatePagination({ page, limit }: PaginationParams): string | null {
    if (page !== undefined && (isNaN(page) || page < 1))
      return MEMBERSHIP_ORDER_ERROR_MESSAGE.INVALID_PAGE_OR_LIMIT;
    if (limit !== undefined && (isNaN(limit) || limit < 1))
      return MEMBERSHIP_ORDER_ERROR_MESSAGE.INVALID_PAGE_OR_LIMIT;
    return null;
  }

  static validateList(params: ListOrderParams): string | null {
    const pagErr = this.validatePagination(params);
    if (pagErr) return pagErr;

    if (params.status && !VALID_ORDER_STATUSES.includes(params.status as any))
      return MEMBERSHIP_ORDER_ERROR_MESSAGE.INVALID_STATUS;

    return null;
  }

  static validateDetail({ razorpayOrderId }: DetailOrderParams): string | null {
    if (
      razorpayOrderId !== undefined &&
      (!razorpayOrderId || typeof razorpayOrderId !== "string")
    )
      return MEMBERSHIP_ORDER_ERROR_MESSAGE.INVALID_ORDER_ID;
    return null;
  }
}