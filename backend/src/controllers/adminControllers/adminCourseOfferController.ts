import { Request, Response } from "express";
import { IAdminCourseOfferService } from "../../services/adminServices/interface/IAdminCourseOfferService";
import { StatusCode } from "../../utils/enums";
import { IAdminCourseOfferController } from "./interface/IAdminCourseOfferController";
import { COURSE_OFFER_SUCCESS_MESSAGE, COURSE_OFFER_ERROR_MESSAGE } from "../../utils/constants";

export class AdminCourseOfferController implements IAdminCourseOfferController {
  private _adminCourseOfferService: IAdminCourseOfferService;
  constructor(adminCourseOfferService: IAdminCourseOfferService) {
    this._adminCourseOfferService = adminCourseOfferService;
  }

  async getOfferRequests(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const result = await this._adminCourseOfferService.getOfferRequests(Number(page), Number(limit), search as string | undefined, status as string | undefined);
      res.status(StatusCode.OK).json({ success: true, data: result.data, total: result.total, message: COURSE_OFFER_SUCCESS_MESSAGE.GET_OFFER_REQUESTS });
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: err.message || COURSE_OFFER_ERROR_MESSAGE.GENERIC });
    }
  }

  async verifyCourseOffer(req: Request, res: Response): Promise<void> {
    try {
      const { offerId, status, reviews } = req.body;
      if (!offerId || !status || (status !== "approved" && status !== "rejected")) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: COURSE_OFFER_ERROR_MESSAGE.INVALID_INPUT });
        return;
      }
      const updatedOffer = await this._adminCourseOfferService.verifyCourseOffer(offerId, status, reviews);
      res.status(StatusCode.OK).json({ success: true, data: updatedOffer, message: COURSE_OFFER_SUCCESS_MESSAGE.VERIFY_OFFER(status) });
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: err.message || COURSE_OFFER_ERROR_MESSAGE.GENERIC });
    }
  }

  async getOfferById(req: Request, res: Response): Promise<void> {
    try {
      const { offerId } = req.params;
      const offer = await this._adminCourseOfferService.getOfferById(offerId);
      if (!offer) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: COURSE_OFFER_ERROR_MESSAGE.OFFER_NOT_FOUND });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: offer, message: COURSE_OFFER_SUCCESS_MESSAGE.GET_OFFER_BY_ID });
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: err.message || COURSE_OFFER_ERROR_MESSAGE.GENERIC });
    }
  }
}