import {
  ModuleModel,
  CreateModuleDTO,
  IModule,
} from "../../models/moduleModel";
import { GenericRepository } from "../genericRepository";
import { IInstructorModuleRepository } from "./interface/IInstructorModuleRepository";

export class InstructorModuleRepository
  extends GenericRepository<IModule>
  implements IInstructorModuleRepository
{
  constructor() {
    super(ModuleModel);
  }

  async createModule(data: CreateModuleDTO): Promise<IModule> {
    return await this.create(data);
  }

  async getModulesByCourse(courseId: string): Promise<IModule[]> {
    const modules = await this.findAll({ courseId });
    return modules || [];
  }

  async getModuleById(moduleId: string): Promise<IModule | null> {
    return await this.findById(moduleId);
  }

  async updateModule(
    moduleId: string,
    data: Partial<IModule>
  ): Promise<IModule | null> {
    return await this.update(moduleId, data);
  }

  async deleteModule(moduleId: string): Promise<IModule | null> {
    return await this.delete(moduleId);
  }

  async findByTitleOrNumberAndCourseId(
    courseId: string,
    moduleTitle: string,
    moduleNumber: number,
    moduleId?: string
  ): Promise<IModule | null> {
    return await this.findOne({
      courseId,
      _id: { $ne: moduleId },
      $or: [
        { moduleTitle: { $regex: `^${moduleTitle}$`, $options: "i" } },
        { moduleNumber: moduleNumber },
      ],
    });
  }

  async paginateModules(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: IModule[]; total: number }> {
    return this.paginate(filter, page, limit, { moduleNumber: 1 });
  }
}