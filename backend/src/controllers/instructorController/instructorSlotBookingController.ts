import { IInstructorSlotBookingController } from "./interfaces/IInstructorSlotBookingController";
import { IInstructorSlotBookingService } from "../../services/instructorServices/interface/IInstructorSlotBookingService";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { handleControllerError } from "../../utils/errorHandlerUtil";
import { InstructorSlotDetailMessages } from "../../utils/constants";

export class InstructorSlotBookingController
  implements IInstructorSlotBookingController
{
  private _bookingService: IInstructorSlotBookingService;

  constructor(bookingService: IInstructorSlotBookingService) {
    this._bookingService = bookingService;
  }

  async getBookingDetail(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: InstructorSlotDetailMessages.AUTHENTICATION_REQUIRED,
        });
        return;
      }

      const instructorId = new mongoose.Types.ObjectId(req.user.id);
      const slotId = new mongoose.Types.ObjectId(req.params.slotId);

      const booking = await this._bookingService.getBookingDetail(
        instructorId,
        slotId,
      );

      res.status(StatusCode.OK).json({ success: true, booking });
    } catch (error: unknown) {
      handleControllerError(error, res);
    }
  }
}