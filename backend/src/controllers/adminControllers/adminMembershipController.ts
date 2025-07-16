import { Request, Response } from "express";
import { IAdminMembershipController } from "./interface/IAdminMembershipController";
import { IAdminMembershipService } from "../../services/interface/IAdminMembershipService";
import { MembershipMessages } from "../../utils/constants";

export class AdminMembershipController implements IAdminMembershipController {
  private membershipService: IAdminMembershipService;

  constructor(membershipService: IAdminMembershipService) {
    this.membershipService = membershipService;
  }

  async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = await this.membershipService.createPlan(req.body);
      res.status(201).json({
        message: MembershipMessages.CREATE_SUCCESS,
        plan,
      });
    } catch (error) {
      res.status(400).json({
        message: MembershipMessages.CREATE_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async updatePlan(req: Request, res: Response): Promise<void> {
    try {
      const { membershipId } = req.params;
      const updated = await this.membershipService.updatePlan(
        membershipId,
        req.body
      );

      if (!updated) {
        res.status(404).json({ message: MembershipMessages.NOT_FOUND });
        return;
      }

      res.json({
        message: MembershipMessages.UPDATE_SUCCESS,
        plan: updated,
      });
    } catch (error) {
      res.status(400).json({
        message: MembershipMessages.UPDATE_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async deletePlan(req: Request, res: Response): Promise<void> {
    try {
      const { membershipId } = req.params;
      const deleted = await this.membershipService.deletePlan(membershipId);

      if (!deleted) {
        res.status(404).json({ message: MembershipMessages.NOT_FOUND });
        return;
      }

      res.json({ message: MembershipMessages.DELETE_SUCCESS });
    } catch (error) {
      res.status(500).json({
        message: MembershipMessages.DELETE_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async getPlanById(req: Request, res: Response): Promise<void> {
    try {
      const { membershipId } = req.params;
      const plan = await this.membershipService.getPlanById(membershipId);

      if (!plan) {
        res.status(404).json({ message: MembershipMessages.NOT_FOUND });
        return;
      }

      res.json({
        message: MembershipMessages.FETCH_ONE_SUCCESS,
        plan,
      });
    } catch (error) {
      res.status(500).json({
        message: MembershipMessages.FETCH_ONE_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async getAllPlans(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;

      const filter =
        search && typeof search === "string"
          ? { name: { $regex: new RegExp(search, "i") } }
          : {};

      const { data, total } = await this.membershipService.paginatePlans(
        filter,
        Number(page),
        Number(limit)
      );

      res.json({
        message: MembershipMessages.FETCH_ALL_SUCCESS,
        plans: data,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error) {
      res.status(500).json({
        message: MembershipMessages.FETCH_ALL_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { membershipId } = req.params;
      const updated = await this.membershipService.toggleStatus(membershipId);

      if (!updated) {
        res.status(404).json({ message: MembershipMessages.NOT_FOUND });
        return;
      }

      res.json({
        message: "Membership plan status updated successfully.",
        plan: updated,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to update membership plan status.",
        error: (error as Error).message || "Unknown error",
      });
    }
  }
}
