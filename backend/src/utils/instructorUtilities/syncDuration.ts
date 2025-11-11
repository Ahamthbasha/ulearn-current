// src/utils/syncDuration.ts
import { IInstructorModuleService } from "../../services/instructorServices/interface/IInstructorModuleService";
import { IInstructorCourseService } from "../../services/instructorServices/interface/IInstructorCourseService";

export const syncDurations = async (
  moduleService: IInstructorModuleService,
  courseService: IInstructorCourseService,
  moduleId: string
): Promise<void> => {
  // 1. Update module
  await moduleService.updateModuleDuration(moduleId);

  // 2. Get the module to know its courseId
  const module = await moduleService.getModuleById(moduleId);
  if (module?.courseId) {
    await courseService.updateCourseDuration(module.courseId.toString());
  }
};