import { IModule } from "../../models/moduleModel";
import { ModuleDTO } from "../../dto/instructorDTO/moduleDTO";

export function mapModuleToDTO(module: IModule): ModuleDTO {
  return {
    _id: module._id.toString(),
    moduleTitle: module.moduleTitle,
    moduleNumber: module.moduleNumber,
    description: module.description,
    courseId: module.courseId.toString(),
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  };
}

export function mapModulesToDTO(modules: IModule[]): ModuleDTO[] {
  return modules.map(mapModuleToDTO);
}