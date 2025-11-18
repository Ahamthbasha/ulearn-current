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
import { appLogger } from "../../utils/logger";

config();

export class AdminController implements IAdminController {
  private _adminService: IAdminService;
  private _JWT: IJwtService;

  constructor(adminService: IAdminService, jwtService: IJwtService) {
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
      role: Roles.ADMIN,
      id: admin?._id,
    });

    const isProduction = process.env.NODE_ENV === "production";
    
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res
      .cookie("accessToken", accessToken,cookieOptions)
      .cookie("refreshToken", refreshToken,cookieOptions)
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
    appLogger.error("Admin login error", error);
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
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const { users, total } = await this._adminService.getAllUsers(
        page,
        limit,
        search,
      );

      res.status(StatusCode.OK).json({
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
      return
    } catch (error) {
      appLogger.error("Error fetching users:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ResponseError.FETCH_ERROR,
      });
      return
    }
  }

  async getAllInstructors(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;

      const { instructors, total } = await this._adminService.getAllInstructors(
        Number(page),
        Number(limit),
        String(search),
      );

      res.status(StatusCode.OK).json({
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
      return
    } catch (error) {
      appLogger.error("Error fetching instructors:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ResponseError.FETCH_ERROR,
      });
      return
    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;

      const userData = await this._adminService.getUserData(email);

      if (!userData) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ResponseError.USER_NOT_FOUND,
        });
        return
      }

      const emailId = userData.email;
      const isBlocked = !userData?.isBlocked;

      const userStatus = await this._adminService.updateProfile(emailId, {
        isBlocked,
      });

      res.status(StatusCode.OK).json({
        success: true,
        message: userStatus?.isBlocked
          ? ResponseError.ACCOUNT_BLOCKED
          : ResponseError.ACCOUNT_UNBLOCKED,
      });
      return
    } catch (error) {
      appLogger.error("Error blocking user", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ResponseError.INTERNAL_SERVER_ERROR,
      });
      return
    }
  }

  async blockInstructor(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      const userData = await this._adminService.getInstructorData(email);

      if (!userData) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: ResponseError.NOT_FOUND,
        });
        return
      }

      const emailId = userData.email;
      const isBlocked = !userData?.isBlocked;

      const userStatus = await this._adminService.updateInstructorProfile(
        emailId,
        { isBlocked },
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: userStatus?.isBlocked
          ? ResponseError.ACCOUNT_BLOCKED
          : ResponseError.ACCOUNT_UNBLOCKED,
      });
      return
    } catch (error) {
      appLogger.error("Error blocking instructor", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ResponseError.INTERNAL_SERVER_ERROR,
      });
      return
    }
  }
}