import { IAdminCourseController } from "./interface/IAdminCourseController";
import { IAdminCourseService } from "../../services/interface/IAdminCourseService";
import { Request, Response } from "express";

export class AdminCourseController implements IAdminCourseController {
  constructor(private readonly adminCourseService: IAdminCourseService) {}

  async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const { search = "", page = "1", limit = "10" } = req.query;

      const parsedPage = parseInt(page as string, 10) || 1;
      const parsedLimit = parseInt(limit as string, 10) || 10;

      const result = await this.adminCourseService.fetchAllCourses(
        search as string,
        parsedPage,
        parsedLimit
      );

      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: parsedPage,
        limit: parsedLimit,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }


  async getCourseDetails(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;

    const result = await this.adminCourseService.getCourseDetails(courseId);

    console.log('result',result)

    if (!result.course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}


  async updateListingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const updatedCourse = await this.adminCourseService.toggleCourseListing(
        courseId
      );

      if (!updatedCourse) {
        res.status(404).json({ success: false, message: "Course not found" });
        return;
      }

      const message = updatedCourse.isListed
        ? "Course listed successfully"
        : "Course unlisted successfully";

      res.status(200).json({ success: true, message, data: updatedCourse });
    } catch (error) {
      console.error("Error toggling listing status:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async toggleVerificationStatus(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;

    const updatedCourse = await this.adminCourseService.toggleCourseVerification(courseId);

    if (!updatedCourse) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const message = updatedCourse.isVerified
      ? "Course verified and listed successfully"
      : "Course unverified and unlisted";

    res.status(200).json({ success: true, message, data: updatedCourse });
  } catch (error) {
    console.error("Error toggling verification status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

}
