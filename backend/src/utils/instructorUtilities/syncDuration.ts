import { IInstructorModuleService } from "../../services/instructorServices/interface/IInstructorModuleService";
import { IInstructorCourseService } from "../../services/instructorServices/interface/IInstructorCourseService";

export const syncDurations = async (
  moduleService: IInstructorModuleService,
  courseService: IInstructorCourseService,
  moduleId: string
): Promise<void> => {
  await moduleService.updateModuleDuration(moduleId);
  const module = await moduleService.getModuleById(moduleId);
  if (module?.courseId) {
    await courseService.updateCourseDuration(module.courseId.toString());
  }
};