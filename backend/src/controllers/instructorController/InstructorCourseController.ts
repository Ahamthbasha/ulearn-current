import { Request, Response, NextFunction } from "express";
import { IInstructorCourseController } from "./interfaces/IInstructorCourseController";
import { IInstructorCourseService } from "../../services/instructorServices/interface/IInstructorCourseService"; 
import getId from "../../utils/getId";
import { StatusCode } from "../../utils/enums";
import {
  CourseErrorMessages,
  CourseSuccessMessages,
  INSTRUCTOR_ERROR_MESSAGE,
  INSTRUCTOR_SUCCESS_MESSAGE,
} from "../../utils/constants";
import { uploadToS3Bucket } from "../../utils/s3Bucket";

export class InstructorCourseController implements IInstructorCourseController {
  private _courseService: IInstructorCourseService;
  
  constructor(courseService: IInstructorCourseService) {
    this._courseService = courseService;
  }

  async createCourse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: CourseErrorMessages.MISSING_FILES });
        return;
      }

      const courseName = courseData.courseName?.trim().toLowerCase();
      const isAlreadyCreated =
        await this._courseService.isCourseAlreadyCreatedByInstructor(
          courseName,
          instructorId
        );
      if (isAlreadyCreated) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.COURSE_ALREADY_CREATED,
        });
        return;
      }

      const thumbnailKey = await uploadToS3Bucket(
        files.thumbnail[0],
        "thumbnails"
      );
      const demoVideoKey = await uploadToS3Bucket(
        files.demoVideos[0],
        "demoVideos"
      );

      courseData.courseName = courseName;
      courseData.instructorId = instructorId;
      courseData.thumbnailUrl = thumbnailKey;
      courseData.demoVideo = {
        type: "video",
        url: demoVideoKey,
      };

      const createdCourse = await this._courseService.createCourse(courseData);

      res.status(StatusCode.CREATED).json({
        success: true,
        message: CourseSuccessMessages.COURSE_CREATED,
        data: createdCourse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = req.params;
      const courseData = req.body;
      const instructorId = await getId(req);
      
      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
        });
        return;
      }

      const courseName = courseData.courseName?.trim().toLowerCase();
      const isDuplicate =
        await this._courseService.isCourseAlreadyCreatedByInstructorExcluding(
          courseName,
          instructorId,
          courseId
        );

      if (isDuplicate) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.COURSE_ALREADY_CREATED
        });
        return;
      }

      const files = req.files as {
        demoVideos?: Express.Multer.File[];
        thumbnail?: Express.Multer.File[];
      };

      if (files?.thumbnail) {
        const thumbnailKey = await uploadToS3Bucket(
          files.thumbnail[0],
          "thumbnails"
        );
        courseData.thumbnailUrl = thumbnailKey;
      }

      if (files?.demoVideos) {
        const demoVideoKey = await uploadToS3Bucket(
          files.demoVideos[0],
          "demoVideos"
        );
        courseData.demoVideo = {
          type: "video",
          url: demoVideoKey,
        };
      }

      courseData.courseName = courseName;

      const updatedCourse = await this._courseService.updateCourse(
        courseId,
        courseData
      );

      if (!updatedCourse) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: CourseErrorMessages.COURSE_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: CourseSuccessMessages.COURSE_UPDATED,
        data: updatedCourse,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCourse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = req.params;
      const deleted = await this._courseService.deleteCourse(courseId);
      if (!deleted) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: CourseErrorMessages.COURSE_NOT_FOUND });
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
      const courseDto = await this._courseService.getCourseById(courseId);

      if (!courseDto) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ message: CourseErrorMessages.COURSE_NOT_FOUND });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, data: courseDto });
    } catch (error) {
      next(error);
    }
  }

  async getInstructorCourses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const instructorId = await getId(req);
      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({ 
          success: false, 
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED 
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const result = await this._courseService.getInstructorCoursesPaginated(
        instructorId,
        page,
        limit,
        search
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
      });
    } catch (err) {
      next(err);
    }
  }

  async publishCourse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courseId } = req.params;

      const canPublish = await this._courseService.canPublishCourse(courseId);

      if (!canPublish) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.PUBLISH_COURSE_CONDITION,
        });
        return;
      }

      const updatedCourse = await this._courseService.publishCourse(courseId);

      if (!updatedCourse) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: CourseErrorMessages.COURSE_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: INSTRUCTOR_SUCCESS_MESSAGE.COURSE_PUBLISHED,
        data: updatedCourse,
      });
    } catch (error) {
      next(error);
    }
  }
}