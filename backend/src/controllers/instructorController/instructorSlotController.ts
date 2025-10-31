import { IInstructorSlotController } from "./interfaces/IInstructorSlotController";
import { IInstructorSlotService } from "../../services/instructorServices/interface/IInstructorSlotService";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { handleControllerError, BadRequestError } from "../../utils/errorHandlerUtil";

export class InstructorSlotController implements IInstructorSlotController {
  private _slotService: IInstructorSlotService;

  constructor(slotService: IInstructorSlotService) {
    this._slotService = slotService;
  }

  async createSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const { startTime, endTime, price, recurrenceRule } = req.body;

      if (!startTime || !endTime || price === undefined) {
        throw new BadRequestError("startTime, endTime, and price are required");
      }

      const result = await this._slotService.createSlot(instructorId, {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        price,
        recurrenceRule: recurrenceRule
          ? {
              daysOfWeek: recurrenceRule.daysOfWeek,
              startDate: new Date(recurrenceRule.startDate),
              endDate: new Date(recurrenceRule.endDate),
            }
          : undefined,
      });

      res.status(StatusCode.CREATED).json({ success: true, slot: result });
    } catch (error: unknown) {
      handleControllerError(error, res);
    }
  }

  async updateSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      const updated = await this._slotService.updateSlot(
        instructorId,
        slotId,
        req.body,
      );

      res.status(StatusCode.OK).json({ success: true, slot: updated });
    } catch (error: unknown) {
      handleControllerError(error, res);
    }
  }

  async deleteSlot(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      await this._slotService.deleteSlot(instructorId, slotId);

      res.status(StatusCode.NO_CONTENT).send();
    } catch (error: unknown) {
      handleControllerError(error, res);
    }
  }

  async listSlots(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const date = typeof req.query.date === "string" ? req.query.date : undefined;

      const slots = await this._slotService.listSlots(instructorId, date);

      res.status(StatusCode.OK).json({ success: true, slots });
    } catch (error: unknown) {
      handleControllerError(error, res);
    }
  }

  async getSlotStatsByMonth(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const mode = req.query.mode as "monthly" | "yearly" | "custom";

      if (!mode || !["monthly", "yearly", "custom"].includes(mode)) {
        throw new BadRequestError("Invalid or missing mode");
      }

      const options: {
        month?: number;
        year?: number;
        startDate?: Date;
        endDate?: Date;
      } = {};

      if (mode === "monthly") {
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
          throw new BadRequestError("Valid month (1-12) and year are required");
        }
        options.month = month;
        options.year = year;
      } else if (mode === "yearly") {
        const year = Number(req.query.year);
        if (isNaN(year)) {
          throw new BadRequestError("Valid year is required");
        }
        options.year = year;
      } else if (mode === "custom") {
        const startDateStr = req.query.startDate as string | undefined;
        const endDateStr = req.query.endDate as string | undefined;

        if (!startDateStr || !endDateStr) {
          throw new BadRequestError("startDate and endDate are required for custom mode");
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new BadRequestError("Invalid date format");
        }

        if (startDate >= endDate) {
          throw new BadRequestError("startDate must be before endDate");
        }

        options.startDate = startDate;
        options.endDate = endDate;
      }

      const stats = await this._slotService.getSlotStats(
        instructorId,
        mode,
        options,
      );

      res.status(StatusCode.OK).json({ success: true, data: stats });
    } catch (error: unknown) {
      handleControllerError(error, res);
    }
  }

  async deleteUnbookedSlotsForDate(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new BadRequestError("Authentication required");
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const date = req.query.date as string | undefined;

      if (!date) {
        throw new BadRequestError("Date is required");
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new BadRequestError("Invalid date format");
      }

      await this._slotService.deleteUnbookedSlotsForDate(instructorId, date);

      res.status(StatusCode.NO_CONTENT).send();
    } catch (error: unknown) {
      handleControllerError(error, res);
    }
  }
}