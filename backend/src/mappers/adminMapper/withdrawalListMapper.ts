import { IWithdrawalRequest } from "../../models/withdrawalRequestModel";
import { WithdrawalRequestDTO } from "../../dto/adminDTO/withdrawalRequestDTO";

export function mapWithdrawalRequestToDTO(
  request: IWithdrawalRequest & {
    instructor?: { username: string; email: string };
  },
): WithdrawalRequestDTO {
  const createdAtDate = new Date(request.createdAt);

  // Format: DD-MM-YYYY hh:mm AM/PM
  const formattedDate =
    createdAtDate.toLocaleDateString("en-GB") +
    " " +
    createdAtDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return {
    requestId: request._id?.toString() || "",
    instructorName: request.instructor?.username || "",
    instructorEmail: request.instructor?.email || "",
    amount: request.amount ?? 0,
    status: request.status,
    bankAccount: request.bankAccount ? "Linked" : "Not Linked",
    createdAt: formattedDate,
  };
}
