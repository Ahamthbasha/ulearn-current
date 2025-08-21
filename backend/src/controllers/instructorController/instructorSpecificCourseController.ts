import { Request, Response } from "express";
import { IInstructorCourseSpecificDashboardController } from "./interfaces/IInstructorSpecificCourseController";
import { IInstructorSpecificCourseDashboardService } from "../../services/instructorServices/interface/IInstructorSpecificCourseService";
import { Types } from "mongoose";
import { StatusCode } from "../../utils/enums";
import {
  generatePdfReport,
  generateExcelReport,
} from "../../utils/specificReportGenerator";
import { INSTRUCTOR_ERROR_MESSAGE } from "../../utils/constants";

export class InstructorSpecificCourseDashboardController
  implements IInstructorCourseSpecificDashboardController
{
  private _dashboardService: IInstructorSpecificCourseDashboardService;
  constructor(dashboardService: IInstructorSpecificCourseDashboardService) {
    this._dashboardService = dashboardService;
  }

  async getCourseDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      if (!Types.ObjectId.isValid(courseId)) {
        res
          .status(StatusCode.BAD_REQUEST)
          .json({ success: false, message: "Invalid Course ID" });
        return;
      }

      const data = await this._dashboardService.getCourseDashboard(
        new Types.ObjectId(courseId),
      );

      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      console.error(
        "[InstructorSpecificCourseDashboardController] Error:",
        error,
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
      const { range, startDate, endDate, page, limit } = req.query;

      if (!Types.ObjectId.isValid(courseId)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_COURSE_ID,
        });
        return;
      }

      const allowedRanges = ["daily", "weekly", "monthly", "yearly", "custom"];
      if (!range || !allowedRanges.includes(range as string)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_RANGE_TYPE,
        });
        return;
      }

      // Parse pagination parameters with defaults
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 5;

      if (pageNum < 1 || limitNum < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_PAGE_LIMIT,
        });
        return;
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const { data, total } =
        await this._dashboardService.getCourseRevenueReport(
          new Types.ObjectId(courseId),
          range as any,
          pageNum,
          limitNum,
          start,
          end,
        );

      res.status(StatusCode.OK).json({ success: true, data, total });
    } catch (error) {
      console.error(
        "[InstructorSpecificCourseDashboardController] Report Error:",
        error,
      );
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_FETCH_COURSE_REVENUE_REPORT,
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
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_COURSE_ID,
        });
        return;
      }

      const allowedRanges = ["daily", "weekly", "monthly", "yearly", "custom"];
      if (!range || !allowedRanges.includes(range as string)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_RANGE_TYPE,
        });
        return;
      }

      if (!["pdf", "excel"].includes(format as string)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.FORMAT_ERROR,
        });
        return;
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const rawData = await this._dashboardService.getCourseRevenueReport(
        new Types.ObjectId(courseId),
        range as any,
        1, // Default page for export (irrelevant since no pagination)
        10000, // Large limit to fetch all records
        start,
        end,
      );

      // Transform to ReportData
      const reportData = rawData.data.map((item) => ({
        orderId: item.orderId,
        createdAt: item.purchaseDate,
        courseName: item.courseName,
        coursePrice: item.coursePrice,
        instructorEarning: item.instructorRevenue,
        totalEnrollments: item.totalEnrollments,
      }));

      if (format === "pdf") {
        await generatePdfReport(reportData, res);
      } else {
        await generateExcelReport(reportData, res);
      }
    } catch (error) {
      console.error(
        "[InstructorSpecificCourseDashboardController] Export Error:",
        error,
      );
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_ERROR_MESSAGE.FAILED_TO_EXPORT_REVENUE_REPORT,
      });
    }
  }
}
