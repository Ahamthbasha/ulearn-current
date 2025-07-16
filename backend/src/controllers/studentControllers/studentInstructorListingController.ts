import { IStudentInstructorListingController } from "./interfaces/IStudentInstructorListingController";
import { IStudentInstructorListingService } from "../../services/interface/IStudentInstructorListingService";
import { Request, Response } from "express";
import { StatusCode } from "../../utils/enums";

export class StudentInstructorListingController
  implements IStudentInstructorListingController
{
  private instructorListingService: IStudentInstructorListingService;

  constructor(service: IStudentInstructorListingService) {
    this.instructorListingService = service;
  }

  async listMentors(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const search = req.query.search as string | undefined;
      const sort = (req.query.sort as "asc" | "desc") || "asc";
      const skill = req.query.skill as string | undefined;
      const expertise = req.query.expertise as string | undefined;

      const result = await this.instructorListingService.getPaginatedMentors(
        page,
        limit,
        search,
        sort,
        skill,
        expertise
      );

      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch instructors",
      });
    }
  }

  async getMentorById(req: Request, res: Response): Promise<void> {
    try {
      const { instructorId } = req.params;
      const mentor = await this.instructorListingService.getMentorById(
        instructorId
      );

      if (!mentor) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Instructor not found",
        });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, data: mentor });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch instructor details",
      });
    }
  }

  async getAvailableFilters(_req: Request, res: Response): Promise<void> {
    try {
      const filters = await this.instructorListingService.getAvailableFilters();
      console.log("filters", filters);
      res.status(StatusCode.OK).json({ success: true, ...filters });
    } catch (error) {
      console.log(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch filter options",
      });
    }
  }
}
