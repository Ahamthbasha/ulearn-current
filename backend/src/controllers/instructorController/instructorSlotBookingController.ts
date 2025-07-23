import { IInstructorSlotBookingController } from "./interfaces/IInstructorSlotBookingController";
import { IInstructorSlotBookingService } from "../../services/interface/IInstructorSlotBookingService";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";
import { StatusCode } from "../../utils/enums";

export class InstructorSlotBookingController implements IInstructorSlotBookingController {
  constructor(private bookingService: IInstructorSlotBookingService) {}

  async getBookingDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = new mongoose.Types.ObjectId(req.user?.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      const booking = await this.bookingService.getBookingDetail(instructorId, slotId);

      res.status(StatusCode.OK).json({ success: true, booking });
    } catch (error: any) {
      res.status(error.status || StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to fetch booking detail",
      });
    }
  }
}
