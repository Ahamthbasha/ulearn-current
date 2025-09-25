import { IWithdrawalRequest } from "../../models/withdrawalRequestModel";
import { IInstructor } from "../../models/instructorModel";
import { Types } from "mongoose";
import { WithdrawalRequestDTO } from "../../dto/instructorDTO/withdrawalRequestDTO";

export function mapWithdrawalRequestToDTO(
  request: IWithdrawalRequest & { instructorId?: IInstructor | Types.ObjectId },
): WithdrawalRequestDTO {
  const createdAtDate = new Date(request.createdAt);

  const formattedDate =
    createdAtDate.toLocaleDateString("en-GB") +
    " " +
    createdAtDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const instructor = request.instructorId as IInstructor | undefined;
  const instructorName = instructor?.username || "";
  const instructorEmail = instructor?.email || "";

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
