import { Request, Response } from "express";

export interface IStudentInstructorListingController {
  listMentors(req: Request, res: Response): Promise<void>;
  getMentorById(req: Request, res: Response): Promise<void>;
  getAvailableFilters(req: Request, res: Response): Promise<void>;

}
