// verification.mapper.ts
import { IVerificationModel } from "../../models/verificationModel";
import { VerificationRequestDTO } from "../../dto/adminDTO/verificationRequestDTO";

export function mapVerificationToDTO(
  request: IVerificationModel
): VerificationRequestDTO {
  return {
    id: request._id.toString(),
    username: request.username,
    email: request.email,
    status: request.status,
  };
}

// For array of requests
export function mapVerificationArrayToDTO(
  requests: IVerificationModel[]
): VerificationRequestDTO[] {
  return requests.map(mapVerificationToDTO);
}
