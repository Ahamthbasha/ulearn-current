import { IStudentSlotService } from "../../services/interface/IStudentSlotService";
import { IStudentSlotController } from "./interfaces/IStudentSlotController";
import { Request, Response } from "express";
import { StatusCode } from "../../utils/enums";

export class StudentSlotController implements IStudentSlotController {
  private slotService: IStudentSlotService;

  constructor(service: IStudentSlotService) {
    this.slotService = service;
  }

  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const instructorId = req.params.instructorId;
      const slots = await this.slotService.getAvailableSlots(instructorId);
      res.status(StatusCode.OK).json({ success: true, data: slots });
    } catch (err) {
      console.error(err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch available slots",
      });
    }
  }
}
