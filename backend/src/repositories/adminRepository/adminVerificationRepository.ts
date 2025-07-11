import { IVerificationModel } from "../../models/verificationModel";
import { GenericRepository } from "../genericRepository";
import VerificationModel from "../../models/verificationModel";
import { IAdminVerificationRepository } from "../interfaces/IAdminVerificationRepository";
import { InstructorErrorMessages } from "../../utils/constants";
import type { SortOrder } from "mongoose";
export class AdminVerificationRepository extends GenericRepository<IVerificationModel> implements IAdminVerificationRepository {
    constructor() {
        super(VerificationModel);
    }

  async getAllRequests(
  page: number,
  limit: number,
  search: string = ""
): Promise<{ data: IVerificationModel[]; total: number }> {
  try {
    const filter = search
      ? {
          $or: [
            { username: { $regex: new RegExp(search, "i") } },
            { email: { $regex: new RegExp(search, "i") } },
          ],
        }
      : {};

    const sort: Record<string, SortOrder> = { createdAt: -1 };

    return await this.paginate(filter, page, limit, sort);
  } catch (error) {
    throw error;
  }
}


    async getRequestDataByEmail(email: string): Promise<IVerificationModel | null> {
        try {
            return await this.findOne({ email });
        } catch (error) {
            throw error;
        }
    }

    async approveRequest(email: string, status: string, reason?: string): Promise<IVerificationModel | null> {
  try {
    const instructor = await this.findOne({ email });
    if (!instructor) throw new Error(InstructorErrorMessages.INSTRUCTOR_NOT_FOUND);

    const instructorId = instructor._id as unknown as string;

    const updateData: Partial<IVerificationModel> = {
      status,
      reviewedAt: new Date(),
      rejectionReason: status === "rejected" ? reason : undefined,
    };

    return await this.update(instructorId, updateData);
  } catch (error) {
    throw error;
  }
}

}
