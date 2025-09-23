import { Request, Response } from "express";
import { IAdminController } from "./interface/IAdminController";
import { IAdminService } from "../../services/adminServices/interface/IAdminService";
import { config } from "dotenv";
import { Roles, StatusCode } from "../../utils/enums";
import {
  AdminErrorMessages,
  AdminSuccessMessages,
  ResponseError,
} from "../../utils/constants";
import { IJwtService } from "../../services/interface/IJwtService";

config();

export class AdminController implements IAdminController {
  private _adminService: IAdminService;
  private _JWT: IJwtService;

  constructor(adminService: IAdminService,jwtService:IJwtService) {
    this._adminService = adminService;
    this._JWT = jwtService;
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const adminEmail = process.env.ADMINEMAIL;
      const adminPassword = process.env.ADMINPASSWORD;

      if (email !== adminEmail || password !== adminPassword) {
        res.send({
          success: false,
          message:
            email !== adminEmail
              ? AdminErrorMessages.EMAIL_INCORRECT
              : AdminErrorMessages.PASSWORD_INCORRECT,
        });
        return;
      }

      let admin = await this._adminService.getAdminData(email);
      if (!admin) {
        admin = await this._adminService.createAdmin({ email, password });
      }

      const accessToken = await this._JWT.accessToken({
        email,
        role: Roles.ADMIN,
        id: admin?._id,
      });

      const refreshToken = await this._JWT.refreshToken({
        email,
        role:Roles.ADMIN,
        id:admin?._id
      })

      res
        .cookie("accessToken", accessToken, {
          httpOnly: true,
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
        })
        .status(StatusCode.OK)
        .send({
          success: true,
          message: AdminSuccessMessages.LOGIN_SUCCESS,
          token: accessToken,
          data: {
            email,
            role: Roles.ADMIN,
            name: Roles.ADMIN,
            adminId: admin?._id,
          },
        });
    } catch (error) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send({
        success: false,
        message: AdminErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.status(StatusCode.OK).send({
        success: true,
        message: AdminSuccessMessages.LOGOUT_SUCCESS,
      });
    } catch (error) {
      throw error;
    }
  }
  async getAllUsers(req: Request, res: Response): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const { users, total } = await this._adminService.getAllUsers(
        page,
        limit,
        search,
      );

      return res.status(StatusCode.OK).json({
        success: true,
        message:
          users.length > 0
            ? ResponseError.FETCH_USER
            : ResponseError.USER_NOT_FOUND,
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ResponseError.FETCH_ERROR,
      });
    }
  }

  async getAllInstructors(req: Request, res: Response): Promise<any> {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;

      const { instructors, total } = await this._adminService.getAllInstructors(
        Number(page),
        Number(limit),
        String(search),
      );

      return res.status(StatusCode.OK).json({
        success: true,
        message:
          instructors.length > 0
            ? ResponseError.FETCH_INSTRUCTOR
            : ResponseError.USERFETCHING_ERROR,
        instructors,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error) {
      console.error("Error fetching instructors:", error);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ResponseError.FETCH_ERROR,
      });
    }
  }

  async blockUser(req: Request, res: Response): Promise<any> {
    try {
      const { email } = req.params;

      const userData = await this._adminService.getUserData(email);

      if (!userData) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ResponseError.USER_NOT_FOUND,
        });
      }

      const emailId = userData.email;
      const isBlocked = !userData?.isBlocked;

      const userStatus = await this._adminService.updateProfile(emailId, {
        isBlocked,
      });

      return res.status(StatusCode.OK).json({
        success: true,
        message: userStatus?.isBlocked
          ? ResponseError.ACCOUNT_BLOCKED
          : ResponseError.ACCOUNT_UNBLOCKED,
      });
    } catch (error) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ResponseError.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async blockInstructor(req: Request, res: Response): Promise<any> {
    try {
      const { email } = req.params;
      const userData = await this._adminService.getInstructorData(email);

      if (!userData) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ResponseError.NOT_FOUND,
        });
      }

      const emailId = userData.email;
      const isBlocked = !userData?.isBlocked;

      const userStatus = await this._adminService.updateInstructorProfile(
        emailId,
        { isBlocked },
      );

      return res.status(StatusCode.OK).json({
        success: true,
        message: userStatus?.isBlocked
          ? ResponseError.ACCOUNT_BLOCKED
          : ResponseError.ACCOUNT_UNBLOCKED,
      });
    } catch (error) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ResponseError.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
