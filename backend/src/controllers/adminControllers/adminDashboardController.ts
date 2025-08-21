import { Request, Response } from "express";
import { IAdminDashboardController } from "./interface/IAdminDashboardController";
import { IAdminDashboardService } from "../../services/adminServices/interface/IAdminDashboardService";
import { FilterType } from "../../types/dashboardTypes";
import {
  generateCourseSalesPdfReport,
  generateCourseSalesExcelReport,
  generateMembershipSalesPdfReport,
  generateMembershipSalesExcelReport,
} from "../../utils/adminReportGenerator";
import { StatusCode } from "../../utils/enums";
import { AdminErrorMessages } from "../../utils/constants";

export class AdminDashboardController implements IAdminDashboardController {
  private _dashboardService: IAdminDashboardService;
  constructor(dashboardService: IAdminDashboardService) {
    this._dashboardService = dashboardService;
  }

  async getDashboardData(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this._dashboardService.getDashboardMetrics();
      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      console.error("AdminDashboardController Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getCourseSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const { type, startDate, endDate, page, limit } = req.query;

      if (
        typeof type !== "string" ||
        !["daily", "weekly", "monthly", "custom"].includes(type)
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_DASHBOARD_FILTER_ERROR,
        });
        return;
      }

      const filter = {
        type: type as FilterType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const pageNum = page ? parseInt(page as string, 10) : undefined;
      const limitNum = limit ? parseInt(limit as string, 10) : undefined;

      if (pageNum && (isNaN(pageNum) || pageNum < 1)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_PAGENO_INVALID,
        });
        return;
      }
      if (limitNum && (isNaN(limitNum) || limitNum < 1)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_PAGENOLIMIT_INVALID,
        });
        return;
      }

      const { items, totalAdminShare, totalItems, totalPages, currentPage } =
        await this._dashboardService.getCourseSalesReport(
          filter,
          pageNum,
          limitNum,
        );
      res.status(StatusCode.OK).json({
        success: true,
        data: items,
        adminShare: totalAdminShare,
        totalItems,
        totalPages,
        currentPage,
      });
    } catch (error) {
      console.error("CourseSalesReport Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getMembershipSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const { type, startDate, endDate, page, limit } = req.query;

      if (
        typeof type !== "string" ||
        !["daily", "weekly", "monthly", "custom"].includes(type)
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_DASHBOARD_FILTER_ERROR,
        });
        return;
      }

      const filter = {
        type: type as FilterType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const pageNum = page ? parseInt(page as string, 10) : undefined;
      const limitNum = limit ? parseInt(limit as string, 10) : undefined;

      if (pageNum && (isNaN(pageNum) || pageNum < 1)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_PAGENO_INVALID,
        });
        return;
      }
      if (limitNum && (isNaN(limitNum) || limitNum < 1)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_PAGENOLIMIT_INVALID,
        });
        return;
      }

      const {
        items,
        totalRevenue,
        totalSales,
        totalItems,
        totalPages,
        currentPage,
      } = await this._dashboardService.getMembershipSalesReport(
        filter,
        pageNum,
        limitNum,
      );
      res.status(StatusCode.OK).json({
        success: true,
        data: items,
        totalRevenue,
        totalSales,
        totalItems,
        totalPages,
        currentPage,
      });
    } catch (error) {
      console.error("MembershipSalesReport Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async exportCourseSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const { type, startDate, endDate, format } = req.query;

      if (
        typeof type !== "string" ||
        !["daily", "weekly", "monthly", "custom"].includes(type)
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_DASHBOARD_FILTER_ERROR,
        });
        return;
      }

      if (typeof format !== "string" || !["excel", "pdf"].includes(format)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_INVALID_FORMAT_PARAMETER,
        });
        return;
      }

      const filter = {
        type: type as FilterType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const { items, totalAdminShare } =
        await this._dashboardService.getCourseSalesReport(filter); // No pagination for exports

      if (format === "excel") {
        await generateCourseSalesExcelReport(items, totalAdminShare, res);
      } else {
        await generateCourseSalesPdfReport(items, totalAdminShare, res);
      }
    } catch (error) {
      console.error("ExportCourseSalesReport Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async exportMembershipSalesReport(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { type, startDate, endDate, format } = req.query;

      if (
        typeof type !== "string" ||
        !["daily", "weekly", "monthly", "custom"].includes(type)
      ) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_DASHBOARD_FILTER_ERROR,
        });
        return;
      }

      if (typeof format !== "string" || !["excel", "pdf"].includes(format)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.ADMIN_INVALID_FORMAT_PARAMETER,
        });
        return;
      }

      const filter = {
        type: type as FilterType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const { items } =
        await this._dashboardService.getMembershipSalesReport(filter); // No pagination for exports

      if (format === "excel") {
        await generateMembershipSalesExcelReport(items, res);
      } else {
        await generateMembershipSalesPdfReport(items, res);
      }
    } catch (error) {
      console.error("ExportMembershipSalesReport Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
