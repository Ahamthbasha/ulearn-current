import { Request, Response } from "express";
import { IInstructorMembershipController } from "./interfaces/IInstructorMembershipController";
import { IInstructorMembershipService } from "../../services/interface/IInstructorMembershipService";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";
import { StatusCode } from "../../utils/enums";

export class InstructorMembershipController
  implements IInstructorMembershipController
{
  constructor(private readonly service: IInstructorMembershipService) {}

  async getPlans(_req: Request, res: Response): Promise<void> {
    try {
      const plans = await this.service.getAvailablePlans();
      res.status(StatusCode.OK).json(plans);
    } catch (err) {
      console.error("Error fetching membership plans:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const instructor = await this.service.getInstructorById(instructorId);
      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({ message: "Instructor not found" });
        return;
      }

      res.status(StatusCode.OK).json({ isMentor: instructor.isMentor });
    } catch (err) {
      console.error("Error getting mentor status:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
    }
  }

  async getActiveMembership(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const status = await this.service.getMembershipStatus(instructorId);
      res.status(StatusCode.OK).json(status);
    } catch (err) {
      console.error("Error fetching membership status:", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
  }
}
