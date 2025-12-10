import { IModuleDTO } from "../../../dto/userDTO/courseDetailDTO";

export interface IStudentModuleService {
  getModulesForCourse(courseId: string): Promise<IModuleDTO[]>;
}