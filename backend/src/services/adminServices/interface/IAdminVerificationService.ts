import { VerificationRequestDTO,VerificationRequestDetailDTO } from "../../../dto/adminDTO/verificationRequestDTO";


export interface IAdminVerificationService {
  getAllRequests(
    page: number,
    limit: number,
    search?: string
  ): Promise<{ data: VerificationRequestDTO[]; total: number }>;

  getRequestDataByEmail(email: string): Promise<VerificationRequestDetailDTO | null>;
  
  approveRequest(
    email: string,
    status: string,
    reason?: string
  ): Promise<VerificationRequestDTO | null>;
}
