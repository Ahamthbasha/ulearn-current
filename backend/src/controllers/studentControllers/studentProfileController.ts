import { Response } from "express";
import { IStudentProfileService } from "../../services/studentServices/interface/IStudentProfileService";
import { IStudentProfileController } from "./interfaces/IStudentProfileController";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { StatusCode } from "../../utils/enums";
import {
  StudentSuccessMessages,
  StudentErrorMessages,
} from "../../utils/constants";
import bcrypt from "bcrypt";
import { AuthenticatedRequest } from "../../middlewares/authenticatedRoutes";
import { appLogger } from "../../utils/logger";
import { IUser } from "../../models/userModel";

export class StudentProfileController implements IStudentProfileController {
  private _studentProfileService: IStudentProfileService;

  constructor(studentProfileService: IStudentProfileService) {
    this._studentProfileService = studentProfileService;
  }

  public async getProfile(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const email = req.user?.email;
      if (!email) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: StudentErrorMessages.TOKEN_INVALID,
        });
        return;
      }

      const studentDTO = await this._studentProfileService.getProfile(email);

      if (!studentDTO) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.STUDENT_NOT_FOUND,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.PROFILE_FETCHED,
        data: studentDTO,
      });
    } catch (error) {
      appLogger.error("getProfile error:", error);
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: StudentErrorMessages.TOKEN_INVALID,
      });
    }
  }

  public async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: StudentErrorMessages.TOKEN_INVALID,
        });
        return;
      }

      const { username, skills, expertise, currentStatus } = req.body;

      let profilePicUrl;
      if (req.file) {
        profilePicUrl = await uploadToS3Bucket(req.file, "students");
      }

      const parsedSkills = skills ? JSON.parse(skills) : [];
      const parsedExpertise = expertise ? JSON.parse(expertise) : [];

      const updateData: Partial<IUser> = {
        ...(username && { username }),
        ...(parsedSkills && { skills: parsedSkills }),
        ...(parsedExpertise && { expertise: parsedExpertise }),
        ...(currentStatus && { currentStatus }),
        ...(profilePicUrl && { profilePicUrl }),
      };

      const updatedDTO = await this._studentProfileService.updateProfile(
        userId,
        updateData,
      );

      if (!updatedDTO) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.PROFILE_UPDATE_FAILED,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.PROFILE_UPDATED,
        data: updatedDTO,
      });
    } catch (error) {
      appLogger.error("updateProfile error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.INTERNAL_ERROR,
      });
    }
  }

  public async updatePassword(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      const email = req.user?.email;
      if (!email) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: StudentErrorMessages.TOKEN_INVALID,
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const student = await this._studentProfileService.getUserByEmail(email);

      if (!student) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.STUDENT_NOT_FOUND,
        });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, student.password);
      if (!isMatch) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.CURRENT_PASSWORD_INCORRECT,
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const isUpdated = await this._studentProfileService.updatePassword(
        email,
        hashedPassword,
      );

      if (!isUpdated) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.PASSWORD_UPDATE_FAILED,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.PASSWORD_UPDATED,
      });
    } catch (error) {
      appLogger.error("updatePassword error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.INTERNAL_ERROR,
      });
    }
  }
}
