import InstructorModel, { IInstructor } from "../../models/instructorModel";
import { GenericRepository } from "../genericRepository";
import { IAdminInstructorRepository } from "./interface/IAdminInstructorRepository";

export class AdminInstructorRespository
  extends GenericRepository<IInstructor>
  implements IAdminInstructorRepository
{
  constructor() {
    super(InstructorModel);
  }

  async getAllInstructors(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ instructors: IInstructor[]; total: number }> {
    try {
      const query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };

      const total = await this.countDocuments(query);

      const result = await this.paginate(query, page, limit, { createdAt: -1 });

      return { instructors: result.data, total };
    } catch (error) {
      throw error;
    }
  }

  //get specified data based on email

  async getInstructorData(email: string): Promise<IInstructor | null> {
    try {
      const instructorData = await this.findOne({ email: email });
      return instructorData;
    } catch (error) {
      throw error;
    }
  }

  //block or unblock

  async updateInstructorProfile(email: string, data:Partial<IInstructor>): Promise<IInstructor | null> {
    try {
      const response = await this.findOneAndUpdate(
        { email },
        { $set: data },
        { new: true },
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string): Promise<IInstructor | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      throw error;
    }
  }
}
