import { IModuleDTO } from "../../../dto/userDTO/courseDetailDTO";

export interface IStudentModuleRepository {
  getModulesByCourseId(courseId: string): Promise<IModuleDTO[]>;
}