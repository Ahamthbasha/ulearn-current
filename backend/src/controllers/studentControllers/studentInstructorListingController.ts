import { IStudentInstructorListingController } from "./interfaces/IStudentInstructorListingController";
import { IStudentInstructorListingService } from "../../services/studentServices/interface/IStudentInstructorListingService";
import { Request, Response } from "express";
import { StatusCode } from "../../utils/enums";
import { StudentErrorMessages } from "../../utils/constants";
import { appLogger } from "../../utils/logger";

export class StudentInstructorListingController
  implements IStudentInstructorListingController
{
  private _instructorListingService: IStudentInstructorListingService;

  constructor(instructorListingService: IStudentInstructorListingService) {
    this._instructorListingService = instructorListingService;
  }

  async listMentors(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const search = req.query.search as string | undefined;
      const sort = (req.query.sort as "asc" | "desc") || "asc";
      const skill = req.query.skill as string | undefined;
      const expertise = req.query.expertise as string | undefined;

      const result = await this._instructorListingService.getPaginatedMentors(
        page,
        limit,
        search,
        sort,
        skill,
        expertise,
      );

      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      appLogger.error("error in list mentors", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_LIST_INSTRUCTOR,
      });
    }
  }

  async getMentorById(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId } = req.params;
      const mentor =
        await this._instructorListingService.getMentorById(instructorId);

      if (!mentor) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.INSTRUCTOR_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, data: mentor });
    } catch (error) {
      appLogger.error("error in get mentor", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_FETCH_INSTRUCTOR_DETAIL,
      });
    }
  }

  async getAvailableFilters(_req: Request, res: Response): Promise<void> {
    try {
      const filters =
        await this._instructorListingService.getAvailableFilters();
      res.status(StatusCode.OK).json({ success: true, ...filters });
    } catch (error) {
      appLogger.error("error in filters", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.FAILED_TO_FETCH_FILTER_OPTION,
      });
    }
  }
}
