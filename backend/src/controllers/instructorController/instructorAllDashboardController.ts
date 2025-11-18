import { Response } from "express";
import { Types } from "mongoose";
import { IInstructorAllDashboardController } from "./interfaces/IInstructorAllDashboardController";
import { IInstructorAllCourseDashboardService } from "../../services/instructorServices/interface/IInstructorAllDashboardService";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import {
  IRevenueReportItem,
  ITopSellingCourse,
} from "../../interface/instructorInterface/IInstructorInterface";
import {
  generateExcelReport,
  generatePdfReport,
  ReportData,
} from "../../utils/reportGenerator";
import { StatusCode } from "../../utils/enums";
import { INSTRUCTOR_ERROR_MESSAGE } from "../../utils/constants";
import {
  handleControllerError,
  throwAppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../utils/errorHandlerUtil";


export class InstructorAllCourseDashboardController
  implements IInstructorAllDashboardController
{
  private  _allDashboardService: IInstructorAllCourseDashboardService;

  constructor(allDashboardService: IInstructorAllCourseDashboardService) {
    this._allDashboardService = allDashboardService;
  }

async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const instructorId = req.user?.id;
    if (!instructorId)
      throwAppError(UnauthorizedError, INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED);

    const data = await this._allDashboardService.getInstructorDashboard(
      new Types.ObjectId(instructorId)
    );

    const topCoursesWithUrls = await Promise.all(
      data.topCourses.map(
        async (c: ITopSellingCourse): Promise<ITopSellingCourse & { thumbnailUrl: string }> => ({
          ...c,
          thumbnailUrl: await getPresignedUrl(c.thumbnailUrl),
        })
      )
    );

    res.status(StatusCode.OK).json({
      success: true,
      data: {
        ...data,
        topCourses: topCoursesWithUrls,
      },
    });
  } catch (error) {
    handleControllerError(error, res);
  }
}

  async getDetailedRevenueReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId)
        throwAppError(UnauthorizedError, INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED);

      const { range, startDate, endDate, page = "1", limit = "5" } = req.query as {
        range?: string;
        startDate?: string;
        endDate?: string;
        page?: string;
        limit?: string;
      };

      const allowedRanges = ["daily", "weekly", "monthly", "yearly", "custom"] as const;
      if (!range || !allowedRanges.includes(range as typeof allowedRanges[number]))
        throwAppError(BadRequestError, INSTRUCTOR_ERROR_MESSAGE.INVALID_RANGE);

      const pageNum = Number(page);
      const limitNum = Number(limit);
      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1)
        throwAppError(BadRequestError, INSTRUCTOR_ERROR_MESSAGE.INVALID_PAGE_LIMIT);

      const result = await this._allDashboardService.getDetailedRevenueReport(
        new Types.ObjectId(instructorId),
        range as typeof allowedRanges[number],
        pageNum,
        limitNum,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
        currentPage: pageNum,
        totalPages: Math.ceil(result.total / limitNum),
        limit: limitNum,
      });
    } catch (error) {
      handleControllerError(error, res);
    }
  }

 async exportRevenueReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const instructorId = req.user?.id;
    if (!instructorId)
      throwAppError(UnauthorizedError, INSTRUCTOR_ERROR_MESSAGE.INSTRUCTOR_UNAUTHORIZED);

    const { range, startDate, endDate, format } = req.query as {
      range?: string;
      startDate?: string;
      endDate?: string;
      format?: string;
    };

    const allowedRanges = ["daily", "weekly", "monthly", "yearly", "custom"] as const;
    const allowedFormats = ["pdf", "excel"] as const;

    if (!range || !allowedRanges.includes(range as any))
      throwAppError(BadRequestError, INSTRUCTOR_ERROR_MESSAGE.INVALID_RANGE);
    if (!format || !allowedFormats.includes(format as any))
      throwAppError(BadRequestError, INSTRUCTOR_ERROR_MESSAGE.INVALID_FORMAT);

    const result = await this._allDashboardService.getDetailedRevenueReport(
      new Types.ObjectId(instructorId),
      range as any,
      1,
      10_000,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    if (!result.data.length)
      throwAppError(NotFoundError, INSTRUCTOR_ERROR_MESSAGE.NO_DATA_FOUND);

    const reportData: ReportData[] = result.data.map((item: IRevenueReportItem): ReportData => ({
      orderId: item.orderId.toString(),
      date: item.date,
      instructorRevenue: item.instructorRevenue,
      totalOrderAmount: item.totalOrderAmount,
      couponCode: item.couponCode,
      couponDiscount: item.couponDiscount,
      couponDiscountAmount: item.couponDiscountAmount ?? 0,
      courses: item.courses.map((c) => ({
        courseName: c.courseName,
        price: c.price,
      })),
    }));

    if (format === "excel") {
      await generateExcelReport(reportData, res);
    } else {
      await generatePdfReport(reportData, res);
    }
  } catch (error) {
    handleControllerError(error, res);
  }
}
}