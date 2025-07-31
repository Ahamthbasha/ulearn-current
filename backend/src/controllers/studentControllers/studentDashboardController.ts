import {  Response } from "express";
import { IStudentDashboardController } from "./interfaces/IStudentDashboardController";
import { IStudentDashboardService } from "../../services/interface/IStudentDashboardService";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { ReportFilter } from "../../utils/reportFilterUtils";
import {
  generateStudentCourseReportExcel,
  generateStudentCourseReportPdf,
  generateStudentSlotReportExcel,
  generateStudentSlotReportPdf,
} from "../../utils/studentReportGenerator";

export class StudentDashboardController implements IStudentDashboardController {
  private dashboardService: IStudentDashboardService;

  constructor(dashboardService: IStudentDashboardService) {
    this.dashboardService = dashboardService;
  }

  async getDashboardData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const dashboardData = await this.dashboardService.getStudentDashboardData(userId);
      const monthlyPerformance = await this.dashboardService.getMonthlyPerformance(userId);

      res.status(200).json({
        success: true,
        data: {
          ...dashboardData,
          coursePerformance: monthlyPerformance.coursePerformance,
          slotPerformance: monthlyPerformance.slotPerformance,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCourseReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const { filter, startDate: s, endDate: e, page, limit } = req.query;
      const filterType = (filter as ReportFilter) || "custom";
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;

      const reports = await this.dashboardService.getCourseReport(userId, {
        type: filterType,
        startDate: s as string,
        endDate: e as string,
        page: pageNum,
        limit: limitNum,
      });

      res.json({ success: true, data: reports });
    } catch (error) {
      console.error("Error getting course report:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getSlotReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const { filter, startDate: s, endDate: e, page, limit } = req.query;
      const filterType = (filter as ReportFilter) || "custom";
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;

      const reports = await this.dashboardService.getSlotReport(userId, {
        type: filterType,
        startDate: s as string,
        endDate: e as string,
        page: pageNum,
        limit: limitNum,
      });

      res.json({ success: true, data: reports });
    } catch (error) {
      console.error("Error getting slot report:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async exportCourseReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const { filter, startDate: s, endDate: e, format, page, limit } = req.query;
      const filterType = (filter as ReportFilter) || "custom";
      const exportFormat = (format as string)?.toLowerCase() || "excel";
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;

      const reports = await this.dashboardService.getCourseReport(userId, {
        type: filterType,
        startDate: s as string,
        endDate: e as string,
        page: pageNum,
        limit: limitNum,
      });

      if (exportFormat === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=course_report.pdf");
        await generateStudentCourseReportPdf(reports, res);
      } else {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=course_report.xlsx");
        await generateStudentCourseReportExcel(reports, res);
      }
    } catch (error) {
      console.error("Error exporting course report:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async exportSlotReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const { filter, startDate: s, endDate: e, format, page, limit } = req.query;
      const filterType = (filter as ReportFilter) || "custom";
      const exportFormat = (format as string)?.toLowerCase() || "excel";
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;

      const reports = await this.dashboardService.getSlotReport(userId, {
        type: filterType,
        startDate: s as string,
        endDate: e as string,
        page: pageNum,
        limit: limitNum,
      });

      if (exportFormat === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=slot_report.pdf");
        await generateStudentSlotReportPdf(reports, res);
      } else {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=slot_report.xlsx");
        await generateStudentSlotReportExcel(reports, res);
      }
    } catch (error) {
      console.error("Error exporting slot report:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}