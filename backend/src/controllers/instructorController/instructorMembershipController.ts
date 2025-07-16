import { Request, Response } from "express";
import { IInstructorMembershipController } from "./interfaces/IInstructorMembershipController";
import { IInstructorMembershipService } from "../../services/interface/IInstructorMembershipService";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";

export class InstructorMembershipController
  implements IInstructorMembershipController
{
  constructor(private readonly service: IInstructorMembershipService) {}

  async getPlans(_req: Request, res: Response): Promise<void> {
    try {
      const plans = await this.service.getAvailablePlans();
      res.status(200).json(plans);
    } catch (err) {
      console.error("Error fetching membership plans:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  }

  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const instructor = await this.service.getInstructorById(instructorId);
      if (!instructor) {
        res.status(404).json({ message: "Instructor not found" });
        return;
      }

      res.status(200).json({ isMentor: instructor.isMentor });
    } catch (err) {
      console.error("Error getting mentor status:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  }

  async getActiveMembership(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const status = await this.service.getMembershipStatus(instructorId);
      res.status(200).json(status);
    } catch (err) {
      console.error("Error fetching membership status:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
}
