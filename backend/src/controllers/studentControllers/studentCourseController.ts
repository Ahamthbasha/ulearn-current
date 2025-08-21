import { IStudentCourseController } from "./interfaces/IStudentCourseController";
import { IStudentCourseService } from "../../services/studentServices/interface/IStudentCourseService";
import { Request, Response } from "express";
import { StatusCode } from "../../utils/enums";
import { StudentErrorMessages, StudentSuccessMessages } from "../../utils/constants";

export class StudentCourseController implements IStudentCourseController {
  private _studentCourseService: IStudentCourseService;
  
  constructor(studentCourseService: IStudentCourseService) {
    this._studentCourseService = studentCourseService;
  }

  async getAllCourses(_req: Request, res: Response): Promise<void> {
    try {
      const courses = await this._studentCourseService.getAllCoursesWithDetails();
      
      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.COURSES_FETCHED || "Courses fetched successfully",
        data: courses
      });
    } catch (error) {
      console.error("Error fetching all courses:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.COURSE_FETCH_FAILED
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

      console.log("filtered courses", req.query);

      const parsedPage = parseInt(page as string);
      const parsedLimit = parseInt(limit as string);
      const searchTerm = search.toString();
      const sortOption = sort.toString() as
        | "name-asc"
        | "name-desc"
        | "price-asc"
        | "price-desc";
      const categoryId = category ? category.toString() : undefined;

      // Validate pagination parameters
      if (isNaN(parsedPage) || parsedPage < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid page number"
        });
        return;
      }

      if (isNaN(parsedLimit) || parsedLimit < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid limit value"
        });
        return;
      }

      const result = await this._studentCourseService.getFilteredCoursesWithDetails(
        parsedPage,
        parsedLimit,
        searchTerm,
        sortOption,
        categoryId
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.COURSES_FETCHED || "Courses fetched successfully",
        data: result.data,
        total: result.total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(result.total / parsedLimit)
      });
    } catch (error) {
      console.error("Error fetching filtered courses:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.COURSE_FETCH_FAILED
      });
    }
  }

  async getCourseDetails(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      if (!courseId) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Course ID is required"
        });
        return;
      }

      const courseDTO = await this._studentCourseService.getCourseDetailsById(courseId);

      if (!courseDTO) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Course not found"
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.COURSE_DETAILS_FETCHED || "Course details fetched successfully",
        data: courseDTO
      });
    } catch (error) {
      console.error("Error fetching course details:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.COURSE_DEATILFETCH_FAILED
      });
    }
  }
}