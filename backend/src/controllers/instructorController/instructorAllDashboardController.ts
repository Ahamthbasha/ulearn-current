import { Response } from "express";
import { Types } from "mongoose";
import { IInstructorAllDashboardController } from "./interfaces/IInstructorAllDashboardController";
import { IInstructorAllCourseDashboardService } from "../../services/interface/IInstructorAllDashboardService";
import { AuthenticatedRequest } from "src/middlewares/AuthenticatedRoutes";
import { getPresignedUrl } from "../../utils/getPresignedUrl"; // ✅ Adjust path as needed
import { ITopSellingCourse } from "../../types/dashboardTypes";
import {
  generateExcelReport,
  generatePdfReport,
} from "../../utils/reportGenerator";

export class InstructorAllCourseDashboardController
  implements IInstructorAllDashboardController
{
  private service: IInstructorAllCourseDashboardService;

  constructor(service: IInstructorAllCourseDashboardService) {
    this.service = service;
  }

  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id;

      if (!instructorId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const instructorObjectId = new Types.ObjectId(instructorId);
      const data = await this.service.getInstructorDashboard(
        instructorObjectId
      );

      // ✅ Override thumbnail URLs with pre-signed URLs
      const topCoursesWithUrls = await Promise.all(
        data.topCourses.map(async (course: ITopSellingCourse) => {
          const signedUrl = await getPresignedUrl(course.thumbnailUrl); // Replace with actual method
          return {
            ...course,
            thumbnailUrl: signedUrl,
          };
        })
      );

      // ✅ Replace original with signed version
      const updatedData = {
        ...data,
        topCourses: topCoursesWithUrls,
      };

      res.status(200).json({ success: true, data: updatedData });
    } catch (error: unknown) {
      console.error("Dashboard Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async getDetailedRevenueReport(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { range, startDate, endDate } = req.query;
      const allowed = ["daily", "weekly", "monthly", "yearly", "custom"];
      if (!range || !allowed.includes(range as string)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid or missing range" });
        return;
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const data = await this.service.getDetailedRevenueReport(
        new Types.ObjectId(instructorId),
        range as "daily" | "weekly" | "monthly" | "yearly" | "custom",
        start,
        end
      );

      console.log("report data", data);

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Detailed revenue report error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }

  async exportRevenueReport(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
      const { range, startDate, endDate, format } = req.query;

      if (
        !instructorId ||
        !range ||
        !["pdf", "excel"].includes(format as string)
      ) {
        res
          .status(400)
          .json({ success: false, message: "Missing or invalid parameters" });
        return;
      }

      const data = await this.service.getDetailedRevenueReport(
        new Types.ObjectId(instructorId),
        range as any,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      if (format === "excel") {
        return generateExcelReport(data, res);
      } else {
        return generatePdfReport(data, res);
      }
    } catch (err) {
      console.error("Export Error:", err);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
}
