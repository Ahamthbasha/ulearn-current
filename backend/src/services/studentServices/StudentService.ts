import { IUser } from "../../models/userModel";
import IStudentService from "./interface/IStudentService";
import { IStudentRepository } from "../../repositories/studentRepository/interface/IStudentRepository";

export class StudentServices implements IStudentService {
  private _studentRepository: IStudentRepository;

  constructor(studentRepository: IStudentRepository) {
    this._studentRepository = studentRepository;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this._studentRepository.findByEmail(email);
  }

  async createUser(userData: IUser): Promise<IUser | null> {
    return await this._studentRepository.create(userData);
  }

  async resetPassword(email: string, password: string): Promise<IUser | null> {
    return await this._studentRepository.resetPasswrod(email, password);
  }

  async googleLogin(name: string, email: string): Promise<IUser | null> {
    return await this._studentRepository.googleLogin(name, email);
  }
}
