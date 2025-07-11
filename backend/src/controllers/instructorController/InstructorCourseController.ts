import { Request, Response, NextFunction } from "express";
import { IInstructorCourseController } from "./interfaces/IInstructorCourseController";
import { IInstructorCourseService } from "../../services/interface/IInstructorCourseService";
import getId from "../../utils/getId";
import { StatusCode } from "../../utils/enums";
import { CourseErrorMessages, CourseSuccessMessages } from "../../utils/constants";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { getPresignedUrl } from "../../utils/getPresignedUrl";

export class InstructorCourseController implements IInstructorCourseController {
  constructor(private courseService: IInstructorCourseService) {}

 async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseData = req.body;
      const instructorId = await getId(req);

      if (!instructorId) {
  res.status(StatusCode.UNAUTHORIZED).json({
    success: false,
    message: "Unauthorized: Instructor ID not found.",
  });
  return;
}

      const files = req.files as {
        demoVideos?: Express.Multer.File[];
        thumbnail?: Express.Multer.File[];
      };

      if (!files?.thumbnail || !files?.demoVideos) {
        res.status(StatusCode.BAD_REQUEST).json({ message: CourseErrorMessages.MISSING_FILES });
        return;
      }

      const courseName = courseData.courseName?.trim().toLowerCase();
      const isAlreadyCreated = await this.courseService.isCourseAlreadyCreatedByInstructor(courseName, instructorId);
      if (isAlreadyCreated) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "You have already created a course with this name.",
        });
        return;
      }

      const thumbnailKey = await uploadToS3Bucket(files.thumbnail[0], "thumbnails");
      const demoVideoKey = await uploadToS3Bucket(files.demoVideos[0], "demoVideos");

      courseData.courseName = courseName;
      courseData.instructorId = instructorId;
      courseData.thumbnailUrl = thumbnailKey;
      courseData.demoVideo = {
        type: "video",
        url: demoVideoKey,
      };

      const createdCourse = await this.courseService.createCourse(courseData);

      res.status(StatusCode.CREATED).json({
        success: true,
        message: CourseSuccessMessages.COURSE_CREATED,
        data: createdCourse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const courseData = req.body;
      const instructorId = await getId(req);
      if (!instructorId) {
  res.status(StatusCode.UNAUTHORIZED).json({
    success: false,
    message: "Unauthorized: Instructor ID not found.",
  });
  return;
}
      const courseName = courseData.courseName?.trim().toLowerCase();
      const isDuplicate = await this.courseService.isCourseAlreadyCreatedByInstructorExcluding(
        courseName,
        instructorId,
        courseId
      );

      if (isDuplicate) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "You have already created another course with this name.",
        });
        return;
      }

      const files = req.files as {
        demoVideos?: Express.Multer.File[];
        thumbnail?: Express.Multer.File[];
      };

      if (files?.thumbnail) {
        const thumbnailKey = await uploadToS3Bucket(files.thumbnail[0], "thumbnails");
        courseData.thumbnailUrl = thumbnailKey;
      }

      if (files?.demoVideos) {
        const demoVideoKey = await uploadToS3Bucket(files.demoVideos[0], "demoVideos");
        courseData.demoVideo = {
          type: "video",
          url: demoVideoKey,
        };
      }

      courseData.courseName = courseName;

      const updatedCourse = await this.courseService.updateCourse(courseId, courseData);

      if (!updatedCourse) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: CourseErrorMessages.COURSE_NOT_FOUND,
        });
        return;
      }

      const thumbnailSignedUrl = updatedCourse.thumbnailUrl
        ? await getPresignedUrl(updatedCourse.thumbnailUrl)
        : null;

      const demoVideoSignedUrl = updatedCourse.demoVideo?.url
        ? await getPresignedUrl(updatedCourse.demoVideo.url)
        : null;

      res.status(StatusCode.OK).json({
        success: true,
        message: CourseSuccessMessages.COURSE_UPDATED,
        data: {
          ...updatedCourse.toObject(),
          thumbnailSignedUrl,
          demoVideo: {
            ...updatedCourse.demoVideo,
            urlSigned: demoVideoSignedUrl,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { courseId } = req.params;
      const deleted = await this.courseService.deleteCourse(courseId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ message: CourseErrorMessages.COURSE_NOT_FOUND });
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        message: CourseSuccessMessages.COURSE_DELETED,
      });
    } catch (error) {
      next(error);
    }
  }

  
async getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;
    const course = await this.courseService.getCourseById(courseId);

    if (!course) {
      res.status(StatusCode.NOT_FOUND).json({ message: CourseErrorMessages.COURSE_NOT_FOUND });
      return;
    }

    const courseObj = course.toObject();
    // ✅ Generate signed thumbnail URL
    const thumbnailSignedUrl = courseObj.thumbnailUrl
      ? await getPresignedUrl(courseObj.thumbnailUrl)
      : null;

    // ✅ Generate signed demo video URL
    const demoVideoSignedUrl =
      courseObj.demoVideo?.url ? await getPresignedUrl(courseObj.demoVideo.url) : null;

    // ✅ Add signed URLs to response
    const responseData = {
      ...courseObj,
      thumbnailSignedUrl,
      demoVideo: {
        ...courseObj.demoVideo,
        urlSigned: demoVideoSignedUrl,
      },
    };

    res.status(StatusCode.OK).json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
}

  async getInstructorCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const instructorId = await getId(req);
    if (!instructorId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const { data, total } = await this.courseService.getInstructorCoursesPaginated(
      instructorId,
      page,
      limit,
      search
    );

    const coursesWithSignedUrl = await Promise.all(
      data.map(async (course) => {
        const signedUrl = await getPresignedUrl(course.thumbnailUrl);
        const courseObj = course.toObject();
        console.log(courseObj)
        return {
          ...courseObj,
          thumbnailSignedUrl: signedUrl,
          categoryName: courseObj.category?.categoryName,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: coursesWithSignedUrl,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
}


async publishCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId } = req.params;

    const canPublish = await this.courseService.canPublishCourse(courseId);

    if (!canPublish) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: "Course must have at least one chapter and one quiz question to be published",
      });
      return;
    }

    const updatedCourse = await this.courseService.publishCourse(courseId);

    if (!updatedCourse) {
      res.status(StatusCode.NOT_FOUND).json({
        success: false,
        message: CourseErrorMessages.COURSE_NOT_FOUND,
      });
      return;
    }

    res.status(StatusCode.OK).json({
      success: true,
      message: "Course published successfully",
      data: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
}



}
