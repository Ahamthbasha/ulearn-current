import { IStudentSlotService } from "../../services/studentServices/interface/IStudentSlotService"; 
import { IStudentSlotController } from "./interfaces/IStudentSlotController";
import { Request, Response } from "express";
import { StatusCode } from "../../utils/enums";
import { StudentErrorMessages } from "../../utils/constants";

export class StudentSlotController implements IStudentSlotController {
  private _slotService: IStudentSlotService;

  constructor(slotService: IStudentSlotService) {
    this._slotService = slotService;
  }

  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = req.params.instructorId;
      const slots = await this._slotService.getAvailableSlots(instructorId);
      res.status(StatusCode.OK).json({ success: true, data: slots });
    } catch (err) {
      console.error(err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_FETCH_SLOTS,
      });
    }
  }
}
