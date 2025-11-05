import { CreateModuleDTO, IModule } from "../../../models/moduleModel";

export interface IInstructorModuleRepository {
  createModule(data: CreateModuleDTO): Promise<IModule>;
  getModulesByCourse(courseId: string): Promise<IModule[]>;
  getModuleById(moduleId: string): Promise<IModule | null>;
  updateModule(
    moduleId: string,
    data: Partial<IModule>
  ): Promise<IModule | null>;
  deleteModule(moduleId: string): Promise<IModule | null>;
  findByTitleAndCourseId(
      courseId: string,
      moduleTitle: string,
      moduleId?: string
    ): Promise<IModule | null>
  paginateModules(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: IModule[]; total: number }>;
  reorderModules(courseId:string,orderIds:string[]):Promise<void>
}