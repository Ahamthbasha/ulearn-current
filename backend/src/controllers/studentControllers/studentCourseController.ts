import { IStudentCourseController } from "./interfaces/IStudentCourseController";
import { IStudentCourseService } from "../../services/interface/IStudentCourseService";
import { Request, Response } from "express";

export class StudentCourseController implements IStudentCourseController {
  private studentCourseService: IStudentCourseService;

  constructor(studentCourseService: IStudentCourseService) {
    this.studentCourseService = studentCourseService;
  }

  async getAllCourses(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.studentCourseService.getAllCoursesWithDetails();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("Error fetching all courses:", error);
      res.status(500).json({ success: false, message: "Failed to fetch courses" });
    }
  }

async getFilteredCourses(req: Request, res: Response): Promise<void> {
  try {
    const { page = "1", limit = "8", search = "", sort = "name-asc", category = "" } = req.query;

    console.log('filtered courses',req.query)

    const parsedPage = parseInt(page as string);
    const parsedLimit = parseInt(limit as string);
    const searchTerm = search.toString();
    const sortOption = sort.toString() as
      | "name-asc"
      | "name-desc"
      | "price-asc"
      | "price-desc";
    const categoryId = category ? category.toString() : undefined;

    const result = await this.studentCourseService.getFilteredCoursesWithDetails(
      parsedPage,
      parsedLimit,
      searchTerm,
      sortOption,
      categoryId
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Error fetching paginated courses:", error);
    res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
}



  async getCourseDetails(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    try {
      const details = await this.studentCourseService.getCourseDetailsById(courseId);
      res.status(200).json({ success: true, data: details });
    } catch (error) {
      console.error("Error fetching course details:", error);
      res.status(500).json({ success: false, message: "Failed to fetch course details" });
    }
  }
}
