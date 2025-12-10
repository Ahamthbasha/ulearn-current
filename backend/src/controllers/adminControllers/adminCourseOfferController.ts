import { Request, Response } from "express";
import { IAdminCourseOfferService } from "../../services/adminServices/interface/IAdminCourseOfferService";
import { IAdminCourseOfferController } from "./interface/IAdminCourseOfferController";
import { StatusCode } from "../../utils/enums";
import {
  COURSE_OFFER_SUCCESS_MESSAGE,
  COURSE_OFFER_ERROR_MESSAGE,
} from "../../utils/constants";
import { IOfferRequestsResponse, IVerifyOfferResponse,IOfferByIdResponse } from "../../interface/adminInterface/IadminInterface";
import { appLogger } from "../../utils/logger";
import { OfferStatus } from "../../utils/constants";
import { validateCourseOfferInput } from "../../utils/adminUtilities/validateCourseOfferInput";

export class AdminCourseOfferController implements IAdminCourseOfferController {
  private _adminCourseOfferService: IAdminCourseOfferService;

  constructor(adminCourseOfferService: IAdminCourseOfferService) {
    this._adminCourseOfferService = adminCourseOfferService;
  }

  async getOfferRequests(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const result = await this._adminCourseOfferService.getOfferRequests(
        Number(page),
        Number(limit),
        search as string | undefined,
        status as string | undefined,
      );
      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        total: result.total,
        message: COURSE_OFFER_SUCCESS_MESSAGE.GET_OFFER_REQUESTS,
      } as IOfferRequestsResponse);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : COURSE_OFFER_ERROR_MESSAGE.GENERIC;
      appLogger.error("Get offer requests error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as IOfferRequestsResponse);
    }
  }

  async verifyCourseOffer(req: Request, res: Response): Promise<void> {
    try {
      const { offerId, status, reviews } = req.body;
      const validationError = validateCourseOfferInput(offerId, status, reviews);
      if (validationError) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: validationError,
        } as IVerifyOfferResponse);
        return;
      }
      const updatedOffer = await this._adminCourseOfferService.verifyCourseOffer(
        offerId,
        status as OfferStatus,
        reviews,
      );
      res.status(StatusCode.OK).json({
        success: true,
        data: updatedOffer,
        message: COURSE_OFFER_SUCCESS_MESSAGE.VERIFY_OFFER(status),
      } as IVerifyOfferResponse);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : COURSE_OFFER_ERROR_MESSAGE.GENERIC;
      appLogger.error("Verify course offer error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as IVerifyOfferResponse);
    }
  }

  async getOfferById(req: Request, res: Response): Promise<void> {
    try {
      const { offerId } = req.params;
      const offer = await this._adminCourseOfferService.getOfferById(offerId);
      if (!offer) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: COURSE_OFFER_ERROR_MESSAGE.OFFER_NOT_FOUND,
        } as IOfferByIdResponse);
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        data: offer,
        message: COURSE_OFFER_SUCCESS_MESSAGE.GET_OFFER_BY_ID,
      } as IOfferByIdResponse);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : COURSE_OFFER_ERROR_MESSAGE.GENERIC;
      appLogger.error("Get offer by ID error:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorMessage,
      } as IOfferByIdResponse);
    }
  }
}