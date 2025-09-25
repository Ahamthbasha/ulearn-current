import { AdminWithdrawalRequestDTO } from "../../dto/adminDTO/adminWithdrawalRequest";
import { IWithdrawalRequest } from "../../models/withdrawalRequestModel";
import { Types } from "mongoose";

export function mapAdminWithdrawalRequestToDTO(
  request: IWithdrawalRequest & {
    instructor?: {
      _id: Types.ObjectId;
      username: string;
      email: string;
    };
  },
): AdminWithdrawalRequestDTO {
  const createdAtDate = new Date(request.createdAt);

  const formattedDate =
    createdAtDate.toLocaleDateString("en-GB") +
    " " +
    createdAtDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const instructorName = request.instructor?.username || "";
  const instructorEmail = request.instructor?.email || "";

  return {
    requestId: request._id?.toString() || "",
    instructorName,
    instructorEmail,
    amount: request.amount ?? 0,
    status: request.status,
    bankAccount: request.bankAccount ? "Linked" : "Not Linked",
    createdAt: formattedDate,
    reason: request.remarks || "",
  };
}
