import { Response } from "express";
import { Types } from "mongoose";
import { IInstructorAllDashboardController } from "./interfaces/IInstructorAllDashboardController";
import { IInstructorAllCourseDashboardService } from "../../services/instructorServices/interface/IInstructorAllDashboardService";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import { ITopSellingCourse } from "../../interface/instructorInterface/IInstructorInterface";
import {
  generateExcelReport,
  generatePdfReport,
} from "../../utils/reportGenerator";
import { StatusCode } from "../../utils/enums";
import { INSTRUCTOR_ERROR_MESSAGE, SERVER_ERROR } from "../../utils/constants";

export class InstructorAllCourseDashboardController
  implements IInstructorAllDashboardController
{
  private _allDashboardService: IInstructorAllCourseDashboardService;

  constructor(allDashboardService: IInstructorAllCourseDashboardService) {
    this._allDashboardService = allDashboardService;
  }

  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id;

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
        });
        return;
      }

      const instructorObjectId = new Types.ObjectId(instructorId);
      const data =
        await this._allDashboardService.getInstructorDashboard(
          instructorObjectId,
        );

      // Generate pre-signed URLs for thumbnails
      const topCoursesWithUrls = await Promise.all(
        data.topCourses.map(async (course: ITopSellingCourse) => {
          const signedUrl = await getPresignedUrl(course.thumbnailUrl);
          return {
            ...course,
            thumbnailUrl: signedUrl,
          };
        }),
      );

      const updatedData = {
        ...data,
        topCourses: topCoursesWithUrls,
      };

      res.status(StatusCode.OK).json({
        success: true,
        data: updatedData,
      });
    } catch (error: unknown) {
      console.error("Dashboard Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getDetailedRevenueReport(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
        });
        return;
      }

      const { range, startDate, endDate, page = "1", limit = "5" } = req.query;
      const allowedRanges = ["daily", "weekly", "monthly", "yearly", "custom"];

      if (!range || !allowedRanges.includes(range as string)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_RANGE,
        });
        return;
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_PAGE_LIMIT,
        });
        return;
      }

      const result = await this._allDashboardService.getDetailedRevenueReport(
        new Types.ObjectId(instructorId),
        range as "daily" | "weekly" | "monthly" | "yearly" | "custom",
        pageNum,
        limitNum,
        start,
        end,
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
        currentPage: pageNum,
        totalPages: Math.ceil(result.total / limitNum),
        limit: limitNum,
      });
    } catch (error: unknown) {
      console.error("Detailed revenue report error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async exportRevenueReport(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
      const { range, startDate, endDate, format } = req.query;

      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED,
        });
        return;
      }

      const allowedRanges = ["daily", "weekly", "monthly", "yearly", "custom"];
      const allowedFormats = ["pdf", "excel"];

      if (!range || !allowedRanges.includes(range as string)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_RANGE,
        });
        return;
      }

      if (!format || !allowedFormats.includes(format as string)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.INVALID_FORMAT,
        });
        return;
      }

      const result = await this._allDashboardService.getDetailedRevenueReport(
        new Types.ObjectId(instructorId),
        range as "daily" | "weekly" | "monthly" | "yearly" | "custom",
        1,
        10000,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
      );

      if (result.data.length === 0) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: INSTRUCTOR_ERROR_MESSAGE.NO_DATA_FOUND,
        });
        return;
      }

      if (format === "excel") {
        return generateExcelReport(result.data, res);
      } else {
        return generatePdfReport(result.data, res);
      }
    } catch (error: unknown) {
      console.error("Export Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
