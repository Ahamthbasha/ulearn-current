import { IWithdrawalRequest } from "../../models/withdrawalRequestModel";
import { WithdrawalRequestListDTO } from "../../models/withdrawalRequestModel";

export const toWithdrawalRequestListDTO = (
  request: IWithdrawalRequest & { instructorId?: any },
): WithdrawalRequestListDTO => {
  return {
    _id: String(request._id), // Add this line
    instructorName: request.instructorId?.username || "N/A",
    date: request.createdAt,
    amount: request.amount,
    status: request.status,
    remarks: request.remarks,
  };
};
