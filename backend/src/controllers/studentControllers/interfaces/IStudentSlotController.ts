import { Request, Response } from "express";

export interface IStudentSlotController {
  getAvailableSlots(req: Request, res: Response): Promise<void>;
}
