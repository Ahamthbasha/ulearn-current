import { Request, Response } from "express";
import { IInstructorCourseSpecificDashboardController } from "./interfaces/IInstructorSpecificCourseController";
import { IInstructorSpecificCourseDashboardService } from "../../services/interface/IInstructorSpecificCourseService";
import { Types } from "mongoose";
import { StatusCode } from "../../utils/enums";
import { generatePdfReport,generateExcelReport
 } from "../../utils/specificReportGenerator";

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

      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      console.error(
        "[InstructorSpecificCourseDashboardController] Error:",
        error
      );
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch course dashboard",
      });
    }
  }

  async getCourseRevenueReport(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const { range, startDate, endDate } = req.query;

    if (!Types.ObjectId.isValid(courseId)) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: "Invalid Course ID" });
      return;
    }

    const allowedRanges = ["daily", "weekly", "monthly", "yearly", "custom"];
    if (!range || !allowedRanges.includes(range as string)) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: "Invalid or missing range type" });
      return;
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const data = await this.dashboardService.getCourseRevenueReport(
      new Types.ObjectId(courseId),
      range as any,
      start,
      end
    );

    console.log('specific course revenue',data)

    res.status(StatusCode.OK).json({ success: true, data });
  } catch (error) {
    console.error(
      "[InstructorSpecificCourseDashboardController] Report Error:",
      error
    );
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch course revenue report",
    });
  }
}

async exportCourseRevenueReport(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const { range, startDate, endDate, format } = req.query;

    if (!Types.ObjectId.isValid(courseId)) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid Course ID",
      });
      return;
    }

    const allowedRanges = ["daily", "weekly", "monthly", "yearly", "custom"];
    if (!range || !allowedRanges.includes(range as string)) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid or missing range type",
      });
      return;
    }

    if (!["pdf", "excel"].includes(format as string)) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: "Format must be either 'pdf' or 'excel'",
      });
      return;
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const rawData = await this.dashboardService.getCourseRevenueReport(
      new Types.ObjectId(courseId),
      range as any,
      start,
      end
    );

    // Transform to ReportData
    const reportData = rawData.map((item) => ({
      orderId: item.orderId,
      createdAt: item.purchaseDate,
      courseName: item.courseName,
      coursePrice: item.coursePrice,
      instructorEarning: item.instructorRevenue,
      totalEnrollments:item.totalEnrollments
    }));

    if (format === "pdf") {
      await generatePdfReport(reportData, res);
    } else {
      await generateExcelReport(reportData, res);
    }

  } catch (error) {
    console.error("[InstructorSpecificCourseDashboardController] Export Error:", error);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to export revenue report",
    });
  }
}
}
