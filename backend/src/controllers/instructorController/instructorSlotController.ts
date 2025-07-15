import { IInstructorSlotController } from "./interfaces/IInstructorSlotController";
import { IInstructorSlotService } from "../../services/interface/IInstructorSlotService";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";
import { StatusCode } from "../../utils/enums";

export class InstructorSlotController implements IInstructorSlotController {
  constructor(private slotService: IInstructorSlotService) {}

  async createSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);
      const { startTime, endTime, price } = req.body;

      const slot = await this.slotService.createSlot(
        instructorId,
        new Date(startTime),
        new Date(endTime),
        price
      );

      res.status(StatusCode.CREATED).json({ success: true, slot });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to create slot",
      });
    }
  }

  async updateSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      const updated = await this.slotService.updateSlot(
        instructorId,
        slotId,
        req.body
      );

      res.status(StatusCode.OK).json({ success: true, slot: updated });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to update slot",
      });
    }
  }

  async deleteSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      await this.slotService.deleteSlot(instructorId, slotId);

      res.status(StatusCode.NO_CONTENT).send();
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to delete slot",
      });
    }
  }

  async listSlots(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);

      const slots = await this.slotService.listSlots(instructorId);

      res.status(StatusCode.OK).json({ success: true, slots });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to fetch slots",
      });
    }
  }

  async getSlotStatsByMonth(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);
      const mode = req.query.mode as "monthly" | "yearly" | "custom";

      const options: any = {};

      if (mode === "monthly") {
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        if (!month || !year) throw new Error("Month and year are required");
        options.month = month;
        options.year = year;
      } else if (mode === "yearly") {
        const year = Number(req.query.year);
        if (!year) throw new Error("Year is required");
        options.year = year;
      } else if (mode === "custom") {
        const startDate = req.query.startDate
          ? new Date(req.query.startDate as string)
          : null;
        const endDate = req.query.endDate
          ? new Date(req.query.endDate as string)
          : null;
        if (!startDate || !endDate)
          throw new Error("Start and end date are required");
        options.startDate = startDate;
        options.endDate = endDate;
      } else {
        throw new Error("Invalid mode");
      }

      const stats = await this.slotService.getSlotStats(
        instructorId,
        mode,
        options
      );

      res.status(StatusCode.OK).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to fetch slot stats",
      });
    }
  }
}
