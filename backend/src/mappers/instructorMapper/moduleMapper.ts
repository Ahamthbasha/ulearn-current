// mappers/instructorMapper/moduleMapper.ts
import { IModule } from "../../models/moduleModel";
import { ModuleDTO } from "../../dto/instructorDTO/moduleDTO";
import { formatDuration } from "../../utils/formatDuration";

export interface ModuleDTOWithDuration extends ModuleDTO {
  duration: string; // seconds as string
  durationFormatted: string; // "1h 2m 3s"
}

export function mapModuleToDTO(module: IModule): ModuleDTOWithDuration {
  return {
    _id: module._id.toString(),
    moduleTitle: module.moduleTitle,
    moduleNumber: module.moduleNumber,
    description: module.description,
    courseId: module.courseId.toString(),
    duration: module.duration || "0", // raw seconds
    durationFormatted: formatDuration(module.duration || "0"),
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  };
}

export function mapModulesToDTO(modules: IModule[]): ModuleDTOWithDuration[] {
  return modules.map(mapModuleToDTO);
}