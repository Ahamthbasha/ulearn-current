import { Request, Response } from "express";
import { IInstructorCourseSpecificDashboardController } from "./interfaces/IInstructorSpecificCourseController";
import { IInstructorSpecificCourseDashboardService } from "../../services/interface/IInstructorSpecificCourseService";
import { Types } from "mongoose";
import { StatusCode } from "../../utils/enums"; // Make sure this has OK = 200, BAD_REQUEST = 400, etc.

export class InstructorSpecificCourseDashboardController
  implements IInstructorCourseSpecificDashboardController
{
  constructor(
    private dashboardService: IInstructorSpecificCourseDashboardService
  ) {}

  async getCourseDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      if (!Types.ObjectId.isValid(courseId)) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ success: false, message: "Invalid Course ID" });
        return;
      }

      const data = await this.dashboardService.getCourseDashboard(
        new Types.ObjectId(courseId)
      );

      console.log(data)

      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      console.error("[InstructorSpecificCourseDashboardController] Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch course dashboard",
      });
    }
  }
}
