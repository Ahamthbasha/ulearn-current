import { CreateModuleDTO, IModule } from "../../../models/moduleModel";
import { ModuleDTO } from "../../../dto/instructorDTO/moduleDTO";

export interface IInstructorModuleService {
  createModule(data: CreateModuleDTO): Promise<ModuleDTO>;
  getModulesByCourse(courseId: string): Promise<ModuleDTO[]>;
  getModuleById(moduleId: string): Promise<IModule | null>;
  updateModule(
    moduleId: string,
    data: Partial<IModule>
  ): Promise<ModuleDTO | null>;
  deleteModule(moduleId: string): Promise<IModule | null>;
  findByTitleOrNumberAndCourseId(
    courseId: string,
    moduleTitle: string,
    moduleNumber: number,
    moduleId?: string
  ): Promise<IModule | null>;
  paginateModules(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: ModuleDTO[]; total: number }>;
}