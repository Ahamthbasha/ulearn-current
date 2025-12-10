import {  Response } from "express";
import { IInstructorProfileService } from "../../services/instructorServices/interface/IInstructorProfileService";
import { IInstructorProfileController } from "./interfaces/IInstructorProfileController";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { StatusCode } from "../../utils/enums";
import {
  InstructorErrorMessages,
  InstructorSuccessMessages,
} from "../../utils/constants";
import { appLogger } from "../../utils/logger";
import { IInstructor } from "../../models/instructorModel";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";

export class InstructorProfileController
  implements IInstructorProfileController
{
  private _profileService: IInstructorProfileService;

  constructor(
    profileService: IInstructorProfileService,
  ) {
    this._profileService = profileService;
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const decoded = req.user?.email;

      if(!decoded){
        res.status(StatusCode.FORBIDDEN).json({messag:InstructorErrorMessages.ACCESS_DENIED})
        return
      }

      const instructorProfile = await this._profileService.getProfile(
        decoded,
      );

      if (!instructorProfile || !instructorProfile.status) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: InstructorErrorMessages.UNAUTHORIZED,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: InstructorSuccessMessages.PROFILE_FETCHED,
        data: instructorProfile,
      });
    } catch (err) {
      appLogger.error("profile error", err);
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: InstructorErrorMessages.TOKEN_INVALID,
      });
    }
  }

  async updateProfile(req: 
    AuthenticatedRequest, res: Response): Promise<void> {
    try {
    const token = req.cookies["accessToken"] as string | undefined;
    if (!token) {
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: InstructorErrorMessages.TOKEN_INVALID,
      });
      return;
    }
    const userId = req.user?.id;

    if(!userId){
        res.status(StatusCode.FORBIDDEN).json({messag:InstructorErrorMessages.ACCESS_DENIED})
        return
      }
    const {
      username,
      skills: skillsJson,
      expertise: expertiseJson,
    } = req.body as {
      username?: string;
      skills?: string;
      expertise?: string;
    };

    const file = req.file
    let profilePicUrl: string | undefined;

    if (file) {
      profilePicUrl = await uploadToS3Bucket(
        {
          originalname: file.originalname,
          buffer: file.buffer,
          mimetype: file.mimetype,
        },
        "instructors",
      );
    }

    const parseJsonArray = (jsonStr: string | undefined): string[] | undefined => {
      if (!jsonStr) return undefined;
      try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    };

    const skills = parseJsonArray(skillsJson);
    const expertise = parseJsonArray(expertiseJson);

    const updateData: Partial<IInstructor> = {};

    if (username?.trim()) updateData.username = username.trim();
    if (skills) updateData.skills = skills;
    if (expertise) updateData.expertise = expertise;
    if (profilePicUrl) updateData.profilePicUrl = profilePicUrl;

    if (Object.keys(updateData).length === 0) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: InstructorErrorMessages.NO_VALID_FIELDS_PROVIDED,
      });
      return;
    }

    const updatedProfile = await this._profileService.updateProfile(userId, updateData);

    if (!updatedProfile) {
      res.status(StatusCode.BAD_REQUEST).json({
        success: false,
        message: InstructorErrorMessages.PROFILE_UPDATE_FAILED,
      });
      return;
    }

    res.status(StatusCode.OK).json({
      success: true,
      message: InstructorSuccessMessages.PROFILE_UPDATED,
      data: updatedProfile,
    });
    } catch (err) {
      appLogger.error("error in updating profile", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: InstructorErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const email = req.user?.email;

      if(!email){
        res.status(StatusCode.FORBIDDEN).json({messag:InstructorErrorMessages.ACCESS_DENIED})
        return
      }

      const { currentPassword, newPassword } = req.body;

      const updated = await this._profileService.updatePassword(
        email,
        currentPassword,
        newPassword,
      );

      if (!updated) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: InstructorErrorMessages.PASSWORD_UPDATE_FAILED,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: InstructorSuccessMessages.PASSWORD_UPDATED,
      });
    } catch (err) {
      appLogger.error("error in updating password", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: InstructorErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async updateBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {

      const userId = req.user?.id;

      if(!userId){
        res.status(StatusCode.FORBIDDEN).json({messag:InstructorErrorMessages.ACCESS_DENIED})
        return
      }

      const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

      const updatedProfile = await this._profileService.updateBankAccount(
        userId,
        { accountHolderName, accountNumber, ifscCode, bankName },
      );

      if (!updatedProfile) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: InstructorErrorMessages.BANK_ACCOUNT_UPDATE_FAILED,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: InstructorSuccessMessages.BANK_ACCOUNT_UPDATED,
        data: updatedProfile,
      });
    } catch (err) {
      appLogger.error("error in update bank account", err);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: InstructorErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
