import { IWithdrawalRequest } from "../../models/withdrawalRequestModel";
import { WithdrawalRequestDetailDTO } from "../../dto/adminDTO/withdrawalDetailRequest";

export function mapWithdrawalRequestDetailToDTO(
  request: IWithdrawalRequest,
): WithdrawalRequestDetailDTO {
  const instructor =
    typeof request.instructorId === "object" &&
    "username" in request.instructorId
      ? request.instructorId
      : { username: "", email: "" };

  return {
    requestId: request._id?.toString() || "",
    instructorName: instructor.username || "",
    instructorEmail: instructor.email || "",
    amount: request.amount,
    requestDate: request.createdAt,
    bankAccountLinked: request.bankAccount ? "Linked" : "Not Linked",
    remarks: request.remarks || undefined,
  };
}
