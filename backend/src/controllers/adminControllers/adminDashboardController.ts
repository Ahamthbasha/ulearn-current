import { Request, Response } from "express";
import { IAdminDashboardController } from "./interface/IAdminDashboardController";
import { IAdminDashboardService } from "../../services/interface/IAdminDashboardService";
import { FilterType } from "../../types/dashboardTypes";
import { generateCourseSalesPdfReport,generateCourseSalesExcelReport, generateMembershipSalesPdfReport,generateMembershipSalesExcelReport } from "../../utils/adminReportGenerator";

export class AdminDashboardController implements IAdminDashboardController {
  constructor(private readonly dashboardService: IAdminDashboardService) {}

  async getDashboardData(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.dashboardService.getDashboardMetrics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("AdminDashboardController Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

async getCourseSalesReport(req: Request, res: Response): Promise<void> {
  try {
    const { type, startDate, endDate } = req.query;

    if (
      typeof type !== "string" ||
      !["daily", "weekly", "monthly", "custom"].includes(type)
    ) {
      res.status(400).json({ success: false, message: "Invalid type parameter" });
      return;
    }

    const filter = {
      type: type as FilterType,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const { items, totalAdminShare } = await this.dashboardService.getCourseSalesReport(filter);
    res.status(200).json({ success: true, data: items, adminShare: totalAdminShare });
  } catch (error) {
    console.error("CourseSalesReport Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async getMembershipSalesReport(req: Request, res: Response): Promise<void> {
  try {
    const { type, startDate, endDate } = req.query;

    if (
      typeof type !== "string" ||
      !["daily", "weekly", "monthly", "custom"].includes(type)
    ) {
      res.status(400).json({ success: false, message: "Invalid type parameter" });
      return;
    }

    const filter = {
      type: type as FilterType,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const {
      items,
      totalRevenue,
      totalSales,
    } = await this.dashboardService.getMembershipSalesReport(filter);

    res.status(200).json({
      success: true,
      data: items,
      totalRevenue,
      totalSales,
    });
  } catch (error) {
    console.error("MembershipSalesReport Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async exportCourseSalesReport(req: Request, res: Response): Promise<void> {
  try {
    const { type, startDate, endDate, format } = req.query;

    if (
      typeof type !== "string" ||
      !["daily", "weekly", "monthly", "custom"].includes(type)
    ) {
      res.status(400).json({ success: false, message: "Invalid type parameter" });
      return;
    }

    if (typeof format !== "string" || !["excel", "pdf"].includes(format)) {
      res.status(400).json({ success: false, message: "Invalid format parameter" });
      return;
    }

    const filter = {
      type: type as FilterType,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const { items } = await this.dashboardService.getCourseSalesReport(filter);

    if (format === "excel") {
      await generateCourseSalesExcelReport(items, res);
    } else {
      await generateCourseSalesPdfReport(items, res);
    }
  } catch (error) {
    console.error("ExportCourseSalesReport Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async exportMembershipSalesReport(req: Request, res: Response): Promise<void> {
    try {
      const { type, startDate, endDate, format } = req.query;

      if (
        typeof type !== "string" ||
        !["daily", "weekly", "monthly", "custom"].includes(type)
      ) {
        res.status(400).json({ success: false, message: "Invalid type parameter" });
        return;
      }

      if (typeof format !== "string" || !["excel", "pdf"].includes(format)) {
        res.status(400).json({ success: false, message: "Invalid format parameter" });
        return;
      }

      const filter = {
        type: type as FilterType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const { items } = await this.dashboardService.getMembershipSalesReport(filter);

      if (format === "excel") {
        await generateMembershipSalesExcelReport(items, res);
      } else {
        await generateMembershipSalesPdfReport(items, res);
      }
    } catch (error) {
      console.error("ExportMembershipSalesReport Error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

}
