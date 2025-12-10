import { IStudentCourseController } from "./interfaces/IStudentCourseController";
import { IStudentCourseService } from "../../services/studentServices/interface/IStudentCourseService";
import { Request, Response } from "express";
import { StatusCode } from "../../utils/enums";
import {
  StudentErrorMessages,
  StudentSuccessMessages,
} from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";

export class StudentCourseController implements IStudentCourseController {
  private _studentCourseService: IStudentCourseService;

  constructor(studentCourseService: IStudentCourseService) {
    this._studentCourseService = studentCourseService;
  }

  async getAllCourses(_req: Request, res: Response): Promise<void> {
    try {
      const courses =
        await this._studentCourseService.getAllCoursesWithDetails();

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.COURSES_FETCHED,
        data: courses,
      });
    } catch (error) {
      appLogger.error("Error fetching all courses:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.COURSE_FETCH_FAILED,
      });
    }
  }

  async getFilteredCourses(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = "1",
        limit = "8",
        search = "",
        sort = "name-asc",
        category = "",
      } = req.query;

      const parsedPage = parseInt(page as string);
      const parsedLimit = parseInt(limit as string);
      const searchTerm = search.toString();
      const sortOption = sort.toString() as
        | "name-asc"
        | "name-desc"
        | "price-asc"
        | "price-desc";
      const categoryId = category ? category.toString() : undefined;

      if (isNaN(parsedPage) || parsedPage < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.INVALID_PAGE_NUMBER,
        });
        return;
      }

      if (isNaN(parsedLimit) || parsedLimit < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.INVALID_LIMIT_VALUE,
        });
        return;
      }

      const result =
        await this._studentCourseService.getFilteredCoursesWithDetails(
          parsedPage,
          parsedLimit,
          searchTerm,
          sortOption,
          categoryId,
        );

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.COURSES_FETCHED,
        data: result.data,
        total: result.total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(result.total / parsedLimit),
      });
    } catch (error) {
      appLogger.error("Error fetching filtered courses:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.COURSE_FETCH_FAILED,
      });
    }
  }

  async getCourseDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      if (!courseId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.COURSE_ID_REQUIRED,
        });
        return;
      }

      const userId = req.user?.id

      const courseDTO = userId
        ? await this._studentCourseService.getCourseDetailsById(courseId, userId)
        : await this._studentCourseService.getCourseDetailsById(courseId);

        
      if (!courseDTO) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.COURSE_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.COURSE_DETAILS_FETCHED,
        data: courseDTO,
      });
    } catch (error) {
      appLogger.error("Error fetching course details:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.COURSE_DEATILFETCH_FAILED,
      });
    }
  }

  async getCourses(req: Request, res: Response): Promise<void> {
    try {

      const {category} = req.query

      const categoryId = category ? category.toString() : undefined
      const courses = await this._studentCourseService.getCourses(categoryId);
      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.COURSES_FETCHED,
        data: courses,
      });
    } catch (error) {
      appLogger.error("Error fetching courses for selector:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.COURSE_FETCH_FAILED,
      });
    }
  }
}
