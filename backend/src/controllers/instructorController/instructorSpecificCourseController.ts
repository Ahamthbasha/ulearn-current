import { Request, Response } from "express";
import { IInstructorCourseSpecificDashboardController } from "./interfaces/IInstructorSpecificCourseController";
import { IInstructorSpecificCourseDashboardService } from "../../services/instructorServices/interface/IInstructorSpecificCourseService";
import { Types } from "mongoose";
import { StatusCode } from "../../utils/enums";
import {
  generatePdfReport,
  generateExcelReport,
} from "../../utils/specificReportGenerator";
import {
  INSTRUCTOR_ERROR_MESSAGE,
  INSTRUCTOR_SPECIFIC_COURSE_CONTROLLER,
} from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import { handleControllerError, BadRequestError } from "../../utils/errorHandlerUtil";
type ReportRange = "daily" | "weekly" | "monthly" | "yearly" | "custom";
type ReportFormat = "pdf" | "excel";

const ALLOWED_RANGES: ReportRange[] = ["daily", "weekly", "monthly", "yearly", "custom"];
const ALLOWED_FORMATS: ReportFormat[] = ["pdf", "excel"];

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
        throw new BadRequestError(INSTRUCTOR_SPECIFIC_COURSE_CONTROLLER.INVALID_COURSE_ID);
      }

      const data = await this._dashboardService.getCourseDashboard(
        new Types.ObjectId(courseId),
      );

      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error: unknown) {
      appLogger.error("[InstructorSpecificCourseDashboardController] Error:", error);
      handleControllerError(error, res);
    }
  }

  async getCourseRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { range, startDate, endDate, page, limit } = req.query;

      if (!Types.ObjectId.isValid(courseId)) {
        throw new BadRequestError(INSTRUCTOR_ERROR_MESSAGE.INVALID_COURSE_ID);
      }

      const rangeStr = Array.isArray(range) ? range[0] : range;
      if (typeof rangeStr !== "string" || !ALLOWED_RANGES.includes(rangeStr as ReportRange)) {
        throw new BadRequestError(INSTRUCTOR_ERROR_MESSAGE.INVALID_RANGE_TYPE);
      }
      const rangeValue: ReportRange = rangeStr as ReportRange;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        throw new BadRequestError(INSTRUCTOR_ERROR_MESSAGE.INVALID_PAGE_LIMIT);
      }

      const start = typeof startDate === "string" ? new Date(startDate) : undefined;
      const end = typeof endDate === "string" ? new Date(endDate) : undefined;

      if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
        throw new BadRequestError("Invalid date format");
      }

      const { data, total } =
        await this._dashboardService.getCourseRevenueReport(
          new Types.ObjectId(courseId),
          rangeValue,
          pageNum,
          limitNum,
          start,
          end,
        );

      res.status(StatusCode.OK).json({ success: true, data, total });
    } catch (error: unknown) {
      appLogger.error("get course revenue report error", error);
      handleControllerError(error, res);
    }
  }

  async exportCourseRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { range, startDate, endDate, format } = req.query;

      if (!Types.ObjectId.isValid(courseId)) {
        throw new BadRequestError(INSTRUCTOR_ERROR_MESSAGE.INVALID_COURSE_ID);
      }

      const rangeStr = Array.isArray(range) ? range[0] : range;
      if (typeof rangeStr !== "string" || !ALLOWED_RANGES.includes(rangeStr as ReportRange)) {
        throw new BadRequestError(INSTRUCTOR_ERROR_MESSAGE.INVALID_RANGE_TYPE);
      }
      const rangeValue: ReportRange = rangeStr as ReportRange;

      const formatStr = Array.isArray(format) ? format[0] : format;
      if (typeof formatStr !== "string" || !ALLOWED_FORMATS.includes(formatStr as ReportFormat)) {
        throw new BadRequestError(INSTRUCTOR_ERROR_MESSAGE.FORMAT_ERROR);
      }
      const formatValue: ReportFormat = formatStr as ReportFormat;

      const start = typeof startDate === "string" ? new Date(startDate) : undefined;
      const end = typeof endDate === "string" ? new Date(endDate) : undefined;

      if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
        throw new BadRequestError("Invalid date format");
      }

      const rawData = await this._dashboardService.getCourseRevenueReport(
        new Types.ObjectId(courseId),
        rangeValue,
        1,
        10000,
        start,
        end,
      );

      const reportData = rawData.data.map((item) => ({
        orderId: item.orderId,
        purchaseDate: item.purchaseDate,
        courseName: item.courseName,
        originalCoursePrice: item.originalCoursePrice,
        courseOfferPrice: item.courseOfferPrice,
        couponUsed: item.couponUsed,
        couponDeductionAmount: item.couponDeductionAmount,
        finalCoursePrice: item.finalCoursePrice,
        instructorRevenue: item.instructorRevenue,
        totalEnrollments: item.totalEnrollments,
      }));

      if (formatValue === "pdf") {
        await generatePdfReport(reportData, res);
      } else {
        await generateExcelReport(reportData, res);
      }
    } catch (error: unknown) {
      appLogger.error("export course revenue report error", error);
      handleControllerError(error, res);
    }
  }
}