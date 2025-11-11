import { IModuleDTO } from "../../../dto/userDTO/moduleDetailDTO";

export interface IStudentModuleService {
  getModulesForCourse(courseId: string): Promise<IModuleDTO[]>;
}