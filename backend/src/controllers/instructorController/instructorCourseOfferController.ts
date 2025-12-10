import { Response } from "express";
import { IInstructorCourseOfferService } from "../../services/instructorServices/interface/IInstructorCourseOfferService";
import { StatusCode } from "../../utils/enums";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { InstructorCourseOfferMessages } from "../../utils/constants";

export class InstructorCourseOfferController {
  private _courseOfferService: IInstructorCourseOfferService;

  constructor(courseOfferService: IInstructorCourseOfferService) {
    this._courseOfferService = courseOfferService;
  }

  async createCourseOffer(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = req.user?.id!;
      const { courseId, discountPercentage, startDate, endDate } = req.body;
      const offer = await this._courseOfferService.createCourseOffer(
        instructorId,
        courseId,
        discountPercentage,
        new Date(startDate),
        new Date(endDate),
      );
      res.status(StatusCode.CREATED).json({
        success: true,
        data: offer,
        message: InstructorCourseOfferMessages.OFFER_SUBMITTED_TO_ADMIN,
      });
    } catch (err) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: (err as Error).message });
    }
  }

  async editCourseOffer(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = req.user?.id!;
      const { offerId, discountPercentage, startDate, endDate } = req.body;
      const offer = await this._courseOfferService.editCourseOffer(
        instructorId,
        offerId,
        discountPercentage,
        new Date(startDate),
        new Date(endDate),
      );
      res.status(StatusCode.OK).json({
        success: true,
        data: offer,
        message: InstructorCourseOfferMessages.OFFER_UPDATED_AND_RESUBMITTED_FOR_APPROVAL,
      });
    } catch (err) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: (err as Error).message });
    }
  }

  async resubmitOffer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id!;
      const { offerId, discountPercentage, startDate, endDate } = req.body;
      const offer = await this._courseOfferService.resubmitOffer(
        instructorId,
        offerId,
        discountPercentage,
        new Date(startDate),
        new Date(endDate),
      );
      res.status(StatusCode.OK).json({
        success: true,
        data: offer,
        message: InstructorCourseOfferMessages.OFFER_RESUBMITTED,
      });
    } catch (err) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: (err as Error).message });
    }
  }

  async getOffersByInstructor(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = req.user?.id!;
      const { page = 1, limit = 10, search, status } = req.query;
      const result = await this._courseOfferService.getOffersByInstructor(
        instructorId,
        Number(page),
        Number(limit),
        search as string | undefined,
        status as string | undefined,
      );
      res
        .status(StatusCode.OK)
        .json({ success: true, data: result.data, total: result.total });
    } catch (err) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: (err as Error).message });
    }
  }

  async getOfferById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id!;
      const { offerId } = req.params;
      const offer = await this._courseOfferService.getInstructorCourseOfferById(
        offerId,
        instructorId,
      );
      res.status(StatusCode.OK).json({ success: true, data: offer });
    } catch (err) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: (err as Error).message });
    }
  }

  async deleteOffer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id!;
      const { offerId } = req.params;
      await this._courseOfferService.deleteCourseOffer(instructorId, offerId);
      res
        .status(StatusCode.OK)
        .json({ success: true, message: InstructorCourseOfferMessages.OFFER_DELETED_SUCCESSFULLY });
    } catch (err) {
      res
        .status(StatusCode.BAD_REQUEST)
        .json({ success: false, message: (err as Error).message });
    }
  }
}
