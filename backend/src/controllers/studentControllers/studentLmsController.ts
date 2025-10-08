import { Request, Response } from "express";
import { IStudentLmsService } from "../../services/studentServices/interface/IStudentLmsService"; 
import { IStudentLmsController } from "./interfaces/IStudentLmsController"; 

export class StudentLmsController implements IStudentLmsController {
  constructor(private lmsService: IStudentLmsService) {}

  async getLearningPaths(req: Request, res: Response): Promise<void> {
    try {
      const { query, page = "1", limit = "10", category } = req.query;
      const paths = await this.lmsService.getLearningPaths(
        query as string,
        parseInt(page as string),
        parseInt(limit as string),
        category as string
      );
      res.status(200).json({
        success: true,
        data: paths.paths,
        total: paths.total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getLearningPathById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const path = await this.lmsService.getLearningPathById(id);
      if (!path) {
        res.status(404).json({ success: false, message: "Learning path not found" });
        return;
      }
      res.status(200).json({ success: true, data: path });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}