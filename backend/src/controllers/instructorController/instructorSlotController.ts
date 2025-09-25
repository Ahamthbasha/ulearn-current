import { IInstructorSlotController } from "./interfaces/IInstructorSlotController";
import { IInstructorSlotService } from "../../services/instructorServices/interface/IInstructorSlotService";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { INSTRUCTOR_SLOT_ERROR_MESSAGE } from "../../utils/constants";

export class InstructorSlotController implements IInstructorSlotController {
  private _slotService: IInstructorSlotService;
  constructor(slotService: IInstructorSlotService) {
    this._slotService = slotService;
  }

  async createSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);
      const { startTime, endTime, price } = req.body;

      const slot = await this._slotService.createSlot(
        instructorId,
        new Date(startTime),
        new Date(endTime),
        price,
      );

      res.status(StatusCode.CREATED).json({ success: true, slot });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message || INSTRUCTOR_SLOT_ERROR_MESSAGE.FAILED_TO_CREATE_SLOT,
      });
    }
  }

  async updateSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      const updated = await this._slotService.updateSlot(
        instructorId,
        slotId,
        req.body,
      );

      res.status(StatusCode.OK).json({ success: true, slot: updated });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message || INSTRUCTOR_SLOT_ERROR_MESSAGE.FAILED_TO_UPDATE_SLOT,
      });
    }
  }

  async deleteSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      await this._slotService.deleteSlot(instructorId, slotId);

      res.status(StatusCode.NO_CONTENT).send();
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message || INSTRUCTOR_SLOT_ERROR_MESSAGE.FAILED_TO_DELETE_SLOT,
      });
    }
  }

  async listSlots(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);

      const slots = await this._slotService.listSlots(instructorId);

      res.status(StatusCode.OK).json({ success: true, slots });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message || INSTRUCTOR_SLOT_ERROR_MESSAGE.FAILED_TO_FETCH_SLOT,
      });
    }
  }

  async getSlotStatsByMonth(
    req: AuthenticatedRequest,
    res: Response,
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

      const stats = await this._slotService.getSlotStats(
        instructorId,
        mode,
        options,
      );

      res.status(StatusCode.OK).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:
          error.message ||
          INSTRUCTOR_SLOT_ERROR_MESSAGE.FAILED_TO_FETCH_SLOT_STAT,
      });
    }
  }
}
