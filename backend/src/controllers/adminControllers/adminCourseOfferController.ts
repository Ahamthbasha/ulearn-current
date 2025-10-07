import { Request, Response } from "express";
import { IAdminCourseOfferService } from "../../services/adminServices/interface/IAdminCourseOfferService";
import { StatusCode } from "../../utils/enums";
import { IAdminCourseOfferController } from "./interface/IAdminCourseOfferController";

export class AdminCourseOfferController implements IAdminCourseOfferController {
  private _adminCourseOfferService: IAdminCourseOfferService
  constructor(adminCourseOfferService: IAdminCourseOfferService) {
    this._adminCourseOfferService = adminCourseOfferService
  }

  async getOfferRequests(req: Request, res: Response):Promise<void> {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const result = await this._adminCourseOfferService.getOfferRequests(Number(page), Number(limit), search as string | undefined);
      res.status(StatusCode.OK).json({ success: true, data: result.data, total: result.total });
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: err.message });
    }
  }

  async verifyCourseOffer(req: Request, res: Response) :Promise<void>{
    try {
      const { offerId, status, reviews } = req.body;
      if (!offerId || !status || (status !== "approved" && status !== "rejected")) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "Invalid input data" });
        return
      }
      const updatedOffer = await this._adminCourseOfferService.verifyCourseOffer(offerId, status, reviews);
      res.status(StatusCode.OK).json({ success: true, data: updatedOffer, message: `Offer ${status}` });
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: err.message });
    }
  }

  async getOfferById(req: Request, res: Response) :Promise<void> {
    try {
      const { offerId } = req.params;
      const offer = await this._adminCourseOfferService.getOfferById(offerId);
      if (!offer){
      res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Offer not found" });
      return
      }  
      res.status(StatusCode.OK).json({ success: true, data: offer });
    } catch (err: any) {
      res.status(StatusCode.BAD_REQUEST).json({ success: false, message: err.message });
    }
  }
}
