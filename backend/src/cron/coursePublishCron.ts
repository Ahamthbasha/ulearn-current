import cron from "node-cron";
import { IInstructorCourseRepository } from "../repositories/instructorRepository/interface/IInstructorCourseRepository";
import { appLogger } from "../utils/logger";

export class CoursePublishCron {
  private _courseRepository: IInstructorCourseRepository;

  constructor(courseRepository: IInstructorCourseRepository) {
    this._courseRepository = courseRepository;
  }

  start() {
    cron.schedule(
      "* * * * *",
      async () => {
        try {
          const scheduledCourses =
            await this._courseRepository.getScheduledCourses();
          for (const course of scheduledCourses) {
            await this._courseRepository.updateCourse(course._id.toString(), {
              isPublished: true,
              publishDate: undefined,
            });
            appLogger.info(
              `Course ${course.courseName} (ID: ${course._id}) published automatically`,
            );
          }
        } catch (error) {
          appLogger.error("Error in course publish cron job:", error);
        }
      },
      {
        timezone: "Asia/Kolkata",
      },
    );
    appLogger.info("Course publish cron job started");
  }
}
