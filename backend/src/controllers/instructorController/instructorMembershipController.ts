import { Request, Response } from "express";
import { IInstructorMembershipController } from "./interfaces/IInstructorMembershipController";
import { IInstructorMembershipService } from "../../services/instructorServices/interface/IInstructorMembershipService";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { StatusCode } from "../../utils/enums";
import { INSTRUCTOR_MEMBERSHIP_ERROR_MESSAGE } from "../../utils/constants";
import { appLogger } from "../../utils/logger";

export class InstructorMembershipController
  implements IInstructorMembershipController
{
  private _membershipService: IInstructorMembershipService;
  constructor(membershipService: IInstructorMembershipService) {
    this._membershipService = membershipService;
  }

  async getPlans(_req: Request, res: Response): Promise<void> {
    try {
      const plans = await this._membershipService.getAvailablePlans();
      res.status(StatusCode.OK).json(plans);
    } catch (err) {
      appLogger.error("Error fetching membership plans:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        message: INSTRUCTOR_MEMBERSHIP_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
      });
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const instructor =
        await this._membershipService.getInstructorById(instructorId);
      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({
          message: INSTRUCTOR_MEMBERSHIP_ERROR_MESSAGE.INSTRUCTOR_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({ isMentor: instructor.isMentor });
    } catch (err) {
      appLogger.error("Error getting mentor status:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        message: INSTRUCTOR_MEMBERSHIP_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
      });
    }
  }

  async getActiveMembership(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const status =
        await this._membershipService.getMembershipStatus(instructorId);
      res.status(StatusCode.OK).json(status);
    } catch (err) {
      appLogger.error("Error fetching membership status:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        message: INSTRUCTOR_MEMBERSHIP_ERROR_MESSAGE.SOMETHING_WENT_WRONG,
      });
    }
  }
}
