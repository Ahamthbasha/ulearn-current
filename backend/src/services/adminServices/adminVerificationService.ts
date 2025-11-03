import { IAdminVerificationService } from "./interface/IAdminVerificationService";
import { IAdminVerificationRepository } from "../../repositories/adminRepository/interface/IAdminVerificationRepository";
import IInstructorService from "../instructorServices/interface/IInstructorService";
import {
  VerificationRequestDTO,
  VerificationRequestDetailDTO,
} from "../../dto/adminDTO/verificationRequestDTO";
import {
  mapVerificationArrayToDTO,
  mapVerificationToDTO,
} from "../../mappers/adminMapper/verificationListMapper";
import { getViewableUrl } from "../../utils/getViewableUrl";
import { NotFoundError, InternalServerError } from "../../utils/error";
import { appLogger } from "../../utils/logger";

export class AdminVerificationService implements IAdminVerificationService {
  private _verificationRepository: IAdminVerificationRepository;
  private _instructorService: IInstructorService;

  constructor(
    verificationRepository: IAdminVerificationRepository,
    instructorService: IInstructorService,
  ) {
    this._verificationRepository = verificationRepository;
    this._instructorService = instructorService;
  }

  async getAllRequests(
    page: number,
    limit: number,
    search = "",
  ): Promise<{ data: VerificationRequestDTO[]; total: number }> {
    try {
      const { data, total } = await this._verificationRepository.getAllRequests(
        page,
        limit,
        search,
      );
      return { data: mapVerificationArrayToDTO(data), total };
    } catch (error) {
      if (error instanceof InternalServerError) {
        throw error;
      }
      
      appLogger.error("Error in getAllRequests service", { error });
      throw new InternalServerError("Failed to retrieve verification requests");
    }
  }

  async getRequestDataByEmail(
    email: string,
  ): Promise<VerificationRequestDetailDTO | null> {
    try {
      const request =
        await this._verificationRepository.getRequestDataByEmail(email);
      
      if (!request) {
        return null;
      }

      const resumeUrl = await getViewableUrl(request.resumeUrl);
      const degreeCertificateUrl = await getViewableUrl(
        request.degreeCertificateUrl,
      );

      return {
        id: request._id.toString(),
        username: request.username,
        email: request.email,
        status: request.status,
        resumeUrl,
        degreeCertificateUrl,
      };
    } catch (error) {
      if (error instanceof InternalServerError) {
        throw error;
      }
      
      appLogger.error("Error in getRequestDataByEmail service", { error });
      throw new InternalServerError("Failed to retrieve verification request details");
    }
  }

  async approveRequest(
    email: string,
    status: string,
    reason?: string,
  ): Promise<VerificationRequestDTO | null> {
    try {
      const result = await this._verificationRepository.approveRequest(
        email,
        status,
        reason,
      );
      if (result && status === "approved") {
        try {
          await this._instructorService.setInstructorVerified(email);
        } catch (error) {
          appLogger.error("Error setting instructor verified status", { 
            error, 
            email 
          });
        }
      }

      return result ? mapVerificationToDTO(result) : null;
    } catch (error) {
      if (
        error instanceof NotFoundError || 
        error instanceof InternalServerError
      ) {
        throw error;
      }
      
      appLogger.error("Error in approveRequest service", { error });
      throw new InternalServerError("Failed to process verification request");
    }
  }
}