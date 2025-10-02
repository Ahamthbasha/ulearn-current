import { Request, Response } from "express";
import { IAdminCourseOfferService } from "../../services/adminServices/interface/IAdminCourseOfferService"; 
import { IAdminCourseOfferController } from "./interface/IAdminCourseOfferController"; 
import { ICourse } from "../../models/courseModel";
import { ICourseOffer } from "../../models/courseOfferModel";
import { StatusCode } from "../../utils/enums";
import { COURSE_OFFER_MESSAGE } from "../../utils/constants";

export class AdminCourseOfferController implements IAdminCourseOfferController {
  private _courseOfferService: IAdminCourseOfferService;

  constructor(courseOfferService: IAdminCourseOfferService) {
    this._courseOfferService = courseOfferService;
  }

  async getPublishedCourses(_req: Request, res: Response): Promise<void> {
    try {
      const courses: ICourse[] = await this._courseOfferService.getPublishedCourses();
      res.status(StatusCode.OK).json({ success: true, data: courses });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async createCourseOffer(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, discountPercentage, startDate, endDate } = req.body;
      const offer: ICourseOffer = await this._courseOfferService.createCourseOffer(
        courseId,
        discountPercentage,
        new Date(startDate),
        new Date(endDate),
      );
      res.status(StatusCode.CREATED).json({ success: true, data: offer, message: COURSE_OFFER_MESSAGE.COURSE_OFFER_CREATED });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async editCourseOffer(req: Request, res: Response): Promise<void> {
    try {
      const { offerId, discountPercentage, startDate, endDate } = req.body;
      const offer: ICourseOffer = await this._courseOfferService.editCourseOffer(
        offerId,
        discountPercentage,
        new Date(startDate),
        new Date(endDate),
      );
      res.status(StatusCode.OK).json({ success: true, data: offer, message: COURSE_OFFER_MESSAGE.COURSE_OFFER_EDITED });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async toggleCourseOfferActive(req: Request, res: Response): Promise<void> {
    try {
      const { offerId } = req.params;
      const offer: ICourseOffer = await this._courseOfferService.toggleCourseOfferActive(offerId);
      res.status(StatusCode.OK).json({ success: true, data: offer });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async deleteCourseOffer(req: Request, res: Response): Promise<void> {
    try {
      const { offerId } = req.params;
      await this._courseOfferService.deleteCourseOffer(offerId);
      res.status(StatusCode.OK).json({ success: true, message: COURSE_OFFER_MESSAGE.COURSE_OFFER_DELETED });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async getCourseOffers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const result = await this._courseOfferService.getCourseOffers(
        Number(page),
        Number(limit),
        search as string | undefined,
      );
      res.status(StatusCode.OK).json({ success: true, data: result.data, total: result.total });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

  async getCourseOfferById(req: Request, res: Response): Promise<void> {
    try {
      const { offerId } = req.params;
      const offer = await this._courseOfferService.getCourseOfferById(offerId);
      console.log("offer",offer)
      res.status(StatusCode.OK).json({ success: true, data: offer });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
  }

}