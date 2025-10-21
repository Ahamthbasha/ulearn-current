import { IAdminCourseController } from "./interface/IAdminCourseController";
import { IAdminCourseService } from "../../services/adminServices/interface/IAdminCourseService";
import { Request, Response } from "express";
import { StatusCode } from "../../utils/enums";
import {
  AdminErrorMessages,
  AdminSuccessMessages,
} from "../../utils/constants";

export class AdminCourseController implements IAdminCourseController {
  private _adminCourseService: IAdminCourseService;
  constructor(adminCourseService: IAdminCourseService) {
    this._adminCourseService = adminCourseService;
  }

  async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const { search = "", page = "1", limit = "10" } = req.query;

      const parsedPage = parseInt(page as string, 10) || 1;
      const parsedLimit = parseInt(limit as string, 10) || 10;

      const result = await this._adminCourseService.fetchAllCourses(
        search as string,
        parsedPage,
        parsedLimit,
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
        page: parsedPage,
        limit: parsedLimit,
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async getCourseDetails(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const courseDetailsDTO =
        await this._adminCourseService.getCourseDetails(courseId);

      if (!courseDetailsDTO) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: AdminErrorMessages.ADMINSIDE_COURSE_NOTFOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: courseDetailsDTO,
      });
    } catch (error) {
      console.error("Error fetching course details:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async updateListingStatus(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;

      const updatedCourseDTO =
        await this._adminCourseService.toggleCourseListing(courseId);

      if (!updatedCourseDTO) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: AdminErrorMessages.ADMINSIDE_COURSE_NOTFOUND,
        });
        return;
      }

      const message = updatedCourseDTO.isListed
        ? AdminSuccessMessages.ADMIN_COURSE_LISTED
        : AdminErrorMessages.ADMIN_COURSE_UNLIST;

      res
        .status(StatusCode.OK)
        .json({ success: true, message, data: updatedCourseDTO });
    } catch (error) {
      console.error("Error toggling listing status:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async verifyCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { status, review } = req.body;

      if (!status || (status !== "approved" && status !== "rejected")) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.INVALID_INPUT,
        });
        return;
      }

      if (status === "rejected" && (!review || !review.trim())) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: AdminErrorMessages.REJECTION_REASON_REQUIRED,
        });
        return;
      }

      const updatedCourseDTO = await this._adminCourseService.verifyCourse(
        courseId,
        status,
        review,
      );

      if (!updatedCourseDTO) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: AdminErrorMessages.ADMINSIDE_COURSE_NOTFOUND,
        });
        return;
      }

      const message = updatedCourseDTO.isVerified
        ? AdminSuccessMessages.ADMIN_VERIFIED_COURSE
        : AdminErrorMessages.ADMIN_COURSE_NOTVERIFIED;

      res
        .status(StatusCode.OK)
        .json({ success: true, message, data: updatedCourseDTO });
    } catch (error) {
      console.error("Error verifying course:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
