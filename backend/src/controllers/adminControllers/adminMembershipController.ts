import { Request, Response } from "express";
import { IAdminMembershipController } from "./interface/IAdminMembershipController";
import { IAdminMembershipService } from "../../services/adminServices/interface/IAdminMembershipService"; 
import { AdminErrorMessages, AdminSuccessMessages, MembershipMessages } from "../../utils/constants";
import { StatusCode } from "../../utils/enums";

export class AdminMembershipController implements IAdminMembershipController {
  private _membershipService: IAdminMembershipService;

  constructor(membershipService: IAdminMembershipService) {
    this._membershipService = membershipService;
  }

  async createPlan(req: Request, res: Response): Promise<void> {
    try {
      const plan = await this._membershipService.createPlan(req.body);
      res.status(StatusCode.CREATED).json({
        message: MembershipMessages.CREATE_SUCCESS,
        plan,
      });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({
        message: MembershipMessages.CREATE_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async updatePlan(req: Request, res: Response): Promise<void> {
    try {
      const { membershipId } = req.params;
      const updated = await this._membershipService.updatePlan(
        membershipId,
        req.body
      );

      if (!updated) {
        res.status(StatusCode.NOT_FOUND).json({ message: MembershipMessages.NOT_FOUND });
        return;
      }

      res.json({
        message: MembershipMessages.UPDATE_SUCCESS,
        plan: updated,
      });
    } catch (error) {
      res.status(StatusCode.BAD_REQUEST).json({
        message: MembershipMessages.UPDATE_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async deletePlan(req: Request, res: Response): Promise<void> {
    try {
      const { membershipId } = req.params;
      const deleted = await this._membershipService.deletePlan(membershipId);

      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ message: MembershipMessages.NOT_FOUND });
        return;
      }

      res.json({ message: MembershipMessages.DELETE_SUCCESS });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        message: MembershipMessages.DELETE_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async getPlanById(req: Request, res: Response): Promise<void> {
    try {
      const { membershipId } = req.params;
      const plan = await this._membershipService.getPlanById(membershipId);

      if (!plan) {
        res.status(StatusCode.NOT_FOUND).json({ message: MembershipMessages.NOT_FOUND });
        return;
      }

      res.json({
        message: MembershipMessages.FETCH_ONE_SUCCESS,
        plan,
      });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
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

      const { data, total } = await this._membershipService.paginatePlans(
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
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        message: MembershipMessages.FETCH_ALL_FAILURE,
        error: (error as Error).message || "Unknown error",
      });
    }
  }

  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { membershipId } = req.params;
      const updated = await this._membershipService.toggleStatus(membershipId);

      if (!updated) {
        res.status(StatusCode.NOT_FOUND).json({ message: MembershipMessages.NOT_FOUND });
        return;
      }

      res.json({
        message: AdminSuccessMessages.ADMIN_MEMBERSHIP_UPDATED,
        plan: updated,
      });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        message: AdminErrorMessages.ADMIN_MEMBERSHIP_UPDATE_ERROR,
        error: (error as Error).message || "Unknown error",
      });
    }
  }
}