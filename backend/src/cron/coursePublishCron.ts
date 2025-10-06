import cron from "node-cron";
import { IInstructorCourseRepository } from "../repositories/instructorRepository/interface/IInstructorCourseRepository";

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
          const scheduledCourses = await this._courseRepository.getScheduledCourses();
          for (const course of scheduledCourses) {
            await this._courseRepository.updateCourse(course._id.toString(), {
              isPublished: true,
              publishDate: undefined,
            });
            console.log(`Course ${course.courseName} (ID: ${course._id}) published automatically`);
          }
        } catch (error) {
          console.error("Error in course publish cron job:", error);
        }
      },
      {
        timezone: "Asia/Kolkata",
      }
    );
    console.log("Course publish cron job started");
  }
}