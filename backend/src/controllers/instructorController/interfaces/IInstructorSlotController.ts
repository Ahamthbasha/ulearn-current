import { Request, Response } from "express";

export interface IInstructorSlotController {
  createSlot(req: Request, res: Response): Promise<void>;
  updateSlot(req: Request, res: Response): Promise<void>;
  deleteSlot(req: Request, res: Response): Promise<void>;
  listSlots(req: Request, res: Response): Promise<void>;
  getSlotStatsByMonth(req: Request, res: Response): Promise<void>;
}
