import { IInstructor } from "../../models/instructorModel";
import IInstructorRepository from "../../repositories/instructorRepository/interface/IInstructorRepository";
import IInstructorService from "./interface/IInstructorService";

export default class InstructorService implements IInstructorService {
  private _instructorRepository: IInstructorRepository;

  constructor(instructorRepository: IInstructorRepository) {
    this._instructorRepository = instructorRepository;
  }

  async findByEmail(email: string): Promise<IInstructor | null> {
    return this._instructorRepository.findByEmail(email);
  }

  async createUser(userData: IInstructor): Promise<IInstructor | null> {
    return this._instructorRepository.createUser(userData);
  }

  async resetPassword(
    email: string,
    password: string,
  ): Promise<IInstructor | null> {
    return this._instructorRepository.resetPassword(email, password);
  }

  async googleLogin(name: string, email: string): Promise<IInstructor | null> {
    return this._instructorRepository.googleLogin(name, email);
  }

  async setInstructorVerified(email: string): Promise<IInstructor | null> {
    return this._instructorRepository.updateByEmail(email, {
      isVerified: true,
    });
  }
}
