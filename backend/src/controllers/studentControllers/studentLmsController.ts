import { Request, Response } from "express";
import { IStudentLmsService } from "../../services/studentServices/interface/IStudentLmsService";
import { IStudentLmsController } from "./interfaces/IStudentLmsController";
import { StatusCode } from "../../utils/enums";
import { LMS_ERROR_MESSAGE } from "../../utils/constants";

export class StudentLmsController implements IStudentLmsController {
  private _lmsService: IStudentLmsService
  constructor(lmsService: IStudentLmsService) {
    this._lmsService = lmsService
  }

  async getLearningPaths(req: Request, res: Response): Promise<void> {
    try {
      const { query, page = "1", limit = "10", category, sort = "name-asc" } = req.query;
      const validSortOptions = ["name-asc", "name-desc", "price-asc", "price-desc"];
      const sortOption = validSortOptions.includes(sort as string)
        ? (sort as "name-asc" | "name-desc" | "price-asc" | "price-desc")
        : "name-asc";

      const paths = await this._lmsService.getLearningPaths(
        query as string,
        parseInt(page as string),
        parseInt(limit as string),
        category as string,
        sortOption
      );
      res.status(StatusCode.OK).json({
        success: true,
        data: paths.paths,
        total: paths.total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });
    } catch (error: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }

  async getLearningPathById(req: Request, res: Response): Promise<void> {
    try {
      const { learingPathId } = req.params;
      const path = await this._lmsService.getLearningPathById(learingPathId);
      if (!path) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: LMS_ERROR_MESSAGE.LEARNING_PATH_NOT_FOUND });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: path });
    } catch (error: any) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  }
}