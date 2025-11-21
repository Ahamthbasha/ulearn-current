// import cron from "node-cron";
// import { IInstructorCourseRepository } from "../repositories/instructorRepository/interface/IInstructorCourseRepository";
// import { appLogger } from "../utils/logger";

// export class CoursePublishCron {
//   private _courseRepository: IInstructorCourseRepository;

//   constructor(courseRepository: IInstructorCourseRepository) {
//     this._courseRepository = courseRepository;
//   }

//   start() {
//     cron.schedule(
//       "* * * * *",
//       async () => {
//         try {
//           const scheduledCourses =
//             await this._courseRepository.getScheduledCourses();
//           for (const course of scheduledCourses) {
//             await this._courseRepository.updateCourse(course._id.toString(), {
//               isPublished: true,
//               publishDate: undefined,
//             });
//             appLogger.info(
//               `Course ${course.courseName} (ID: ${course._id}) published automatically`,
//             );
//           }
//         } catch (error) {
//           appLogger.error("Error in course publish cron job:", error);
//         }
//       },
//       {
//         timezone: "Asia/Kolkata",
//       },
//     );
//     appLogger.info("Course publish cron job started");
//   }
// }
































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
          const nowUTC = new Date();
          const nowISTString = nowUTC.toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          appLogger.info(`Course publish cron job running...`);
          appLogger.info(`Current time (UTC): ${nowUTC.toISOString()}`);
          appLogger.info(`Current time (IST): ${nowISTString}`);
          
          const scheduledCourses = await this._courseRepository.getScheduledCourses();
          
          if (scheduledCourses.length === 0) {
            appLogger.info('No scheduled courses found to publish');
            return;
          }
          
          appLogger.info(`Found ${scheduledCourses.length} scheduled course(s) to publish`);
          
          for (const course of scheduledCourses) {
            try {
              const publishDateIST = course.publishDate?.toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              });

              appLogger.info(
                `Publishing course: "${course.courseName}" (ID: ${course._id})`
              );
              appLogger.info(
                `  - Scheduled for (UTC): ${course.publishDate?.toISOString()}`
              );
              appLogger.info(
                `  - Scheduled for (IST): ${publishDateIST}`
              );
              
              await this._courseRepository.updateCourse(course._id.toString(), {
                isPublished: true,
                publishDate: undefined,
              });
              
              appLogger.info(
                `✓ Course "${course.courseName}" (ID: ${course._id}) published successfully`
              );
            } catch (error) {
              appLogger.error(
                `✗ Failed to publish course "${course.courseName}" (ID: ${course._id}):`,
                error
              );
            }
          }
        } catch (error) {
          appLogger.error("Error in course publish cron job:", error);
        }
      },
      {
        timezone: "Asia/Kolkata",
      }
    );
    
    const startTime = new Date();
    appLogger.info("=".repeat(60));
    appLogger.info("Course publish cron job started successfully");
    appLogger.info(`Cron timezone: Asia/Kolkata (IST)`);
    appLogger.info(`Server time (UTC): ${startTime.toISOString()}`);
    appLogger.info(`Server time (IST): ${startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    appLogger.info(`Running every minute: * * * * *`);
    appLogger.info("=".repeat(60));
  }
}