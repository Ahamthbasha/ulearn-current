import { CreateModuleDTO, IModule } from "../../models/moduleModel";
import { ModuleDTO } from "../../dto/instructorDTO/moduleDTO";
import { IInstructorModuleRepository } from "../../repositories/instructorRepository/interface/IInstructorModuleRepository";
import { IInstructorModuleService } from "./interface/IInstructorModuleService";
import {
  mapModuleToDTO,
  mapModulesToDTO,
} from "../../mappers/instructorMapper/moduleMapper";

export class InstructorModuleService implements IInstructorModuleService {
  private _moduleRepo: IInstructorModuleRepository;

  constructor(moduleRepo: IInstructorModuleRepository) {
    this._moduleRepo = moduleRepo;
  }

  async createModule(data: CreateModuleDTO): Promise<ModuleDTO> {
    const module = await this._moduleRepo.createModule(data);
    return mapModuleToDTO(module);
  }

  async getModulesByCourse(courseId: string): Promise<ModuleDTO[]> {
    const modules = await this._moduleRepo.getModulesByCourse(courseId);
    return mapModulesToDTO(modules);
  }

  async getModuleById(moduleId: string): Promise<IModule | null> {
    return this._moduleRepo.getModuleById(moduleId);
  }

  async updateModule(
    moduleId: string,
    data: Partial<IModule>
  ): Promise<ModuleDTO | null> {
    const updatedModule = await this._moduleRepo.updateModule(moduleId, data);
    if (!updatedModule) return null;
    return mapModuleToDTO(updatedModule);
  }

  async deleteModule(moduleId: string): Promise<IModule | null> {
    return this._moduleRepo.deleteModule(moduleId);
  }

  async findByTitleAndCourseId(courseId: string, title: string, moduleId?: string):Promise<IModule|null> {
    return this._moduleRepo.findByTitleAndCourseId(courseId, title, moduleId);
  }

  async paginateModules(
    filter: object,
    page: number,
    limit: number
  ): Promise<{ data: ModuleDTO[]; total: number }> {
    const result = await this._moduleRepo.paginateModules(filter, page, limit);
    return {
      data: mapModulesToDTO(result.data),
      total: result.total,
    };
  }

  async reorderModules(courseId: string, orderedIds: string[]): Promise<void> {
  await this._moduleRepo.reorderModules(courseId, orderedIds);
}
}