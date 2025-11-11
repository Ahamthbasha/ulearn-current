
import { IStudentModuleService } from "./interface/IStudentModuleService";
import { IStudentModuleRepository } from "../../repositories/studentRepository/interface/IStudentModuleRepository";
import { IModuleDTO } from "../../dto/userDTO/moduleDetailDTO";

export class StudentModuleService implements IStudentModuleService {
    private _moduleRepo: IStudentModuleRepository
  constructor(moduleRepo: IStudentModuleRepository) {
    this._moduleRepo = moduleRepo
  }

  async getModulesForCourse(courseId: string): Promise<IModuleDTO[]> {
    return this._moduleRepo.getModulesByCourseId(courseId);
  }
}