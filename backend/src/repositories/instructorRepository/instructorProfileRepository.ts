import { IInstructorProfileRepository } from "../interfaces/IInstructorProfileRepository";
import InstructorModel, { IInstructor } from "../../models/instructorModel";
import { GenericRepository } from "../genericRepository";

export class InstructorProfileRepository
  extends GenericRepository<IInstructor>
  implements IInstructorProfileRepository
{
  constructor() {
    super(InstructorModel);
  }

  async getByEmail(email: string): Promise<IInstructor | null> {
    return await this.findOne({ email });
  }

  async updateProfile(id: string, data: Partial<IInstructor>): Promise<IInstructor | null> {
    return await this.updateOne({ _id: id }, data);
  }

  async updatePassword(email: string, hashedPassword: string): Promise<IInstructor | null> {
    return await this.updateOne({ email }, { password: hashedPassword });
  }
}
