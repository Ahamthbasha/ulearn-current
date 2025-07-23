import { Request, Response } from "express";

export interface IInstructorSlotBookingController {
  getBookingDetail(req: Request, res: Response): Promise<void>;
}
