import InstructorModel, {
  IInstructor,
  IInstructorDTO,
} from "../../models/instructorModel";
import { GenericRepository } from "../genericRepository";
import IInstructorRepository from "../interfaces/IInstructorRepository";
import { InstructorErrorMessages } from "../../utils/constants";
import bcrypt from "bcryptjs";
export default class InstructorRepository
  extends GenericRepository<IInstructor>
  implements IInstructorRepository
{
  constructor() {
    super(InstructorModel);
  }

  async findByEmail(email: string): Promise<IInstructor | null> {
    return await this.findOne({ email });
  }

  async createUser(userData: IInstructorDTO): Promise<IInstructor | null> {
    return await this.create(userData);
  }

  async resetPassword(
    email: string,
    password: string
  ): Promise<IInstructor | null> {
    try {
      const instructor = await this.findOne({ email });

      if (!instructor) {
        throw new Error(InstructorErrorMessages.USER_NOT_FOUND);
      }

      const instructorId = instructor._id as unknown as string;

      return await this.update(instructorId, { password });
    } catch (error) {
      throw error;
    }
  }

  async googleLogin(name: string, email: string): Promise<IInstructor | null> {
    try {
      const instructor = await this.findByEmail(email);

      const username = name;

      if (!instructor) {
        const tempPassword =
          Date.now().toString() + Math.floor(Math.random() * 10000).toString();

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newInstructor = await this.createUser({
          username,
          email,
          password: hashedPassword,
        });

        return newInstructor;
      }

      return instructor;
    } catch (error) {
      throw error;
    }
  }

  async updateByEmail(
    email: string,
    data: Partial<IInstructor>
  ): Promise<IInstructor | null> {
    return await this.updateOne({ email }, data);
  }
  //enroll
  async findById(id: string): Promise<IInstructor | null> {
    return await super.findById(id);
  }

  async getMentorCount(): Promise<number> {
      return await this.countDocuments({isMentor:true})
  }

  async getInstructorCount(): Promise<number> {
      return await this.countDocuments({isVerified:true})
  }
}
