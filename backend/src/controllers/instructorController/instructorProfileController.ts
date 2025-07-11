import { Request, Response } from "express";
import { IInstructorProfileService } from "../../services/interface/IInstructorProfileService";
import { IInstructorProfileController } from "./interfaces/IInstructorProfileController";
import { JwtService } from "../../utils/jwt";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import bcrypt from "bcrypt";
import { StatusCode } from "../../utils/enums";
import {
  InstructorErrorMessages,
  InstructorSuccessMessages,
} from "../../utils/constants";

export class InstructorProfileController implements IInstructorProfileController {
  private service: IInstructorProfileService;
  private jwt = new JwtService();

  constructor(service: IInstructorProfileService) {
    this.service = service;
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies["accessToken"];
    
      const decoded = await this.jwt.verifyToken(token);

      const instructor = await this.service.getProfile(decoded.email);

      if (!instructor || !instructor.isVerified) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: InstructorErrorMessages.UNAUTHORIZED,
        });
        return;
      }

      const profilePicUrl = instructor.profilePicUrl
        ? await getPresignedUrl(instructor.profilePicUrl)
        : undefined;

      res.status(StatusCode.OK).json({
        success: true,
        message: InstructorSuccessMessages.PROFILE_FETCHED,
        data: {
          ...instructor.toObject(),
          profilePicUrl,
        },
      });
    } catch (err) {
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: InstructorErrorMessages.TOKEN_INVALID,
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies["accessToken"];
      const decoded = await this.jwt.verifyToken(token);
      const userId = decoded.id;

      const { username, skills, expertise } = req.body;

      let profilePicUrl;
      if (req.file) {
        profilePicUrl = await uploadToS3Bucket(req.file, "instructors");
      }

      const updateData: any = {
        ...(username && { username }),
        ...(skills && { skills: JSON.parse(skills) }),
        ...(expertise && { expertise: JSON.parse(expertise) }),
        ...(profilePicUrl && { profilePicUrl }),
      };

      const updated = await this.service.updateProfile(userId, updateData);

      if (!updated) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: InstructorErrorMessages.PROFILE_UPDATE_FAILED,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: InstructorSuccessMessages.PROFILE_UPDATED,
        data: updated,
      });
    } catch (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: InstructorErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies["accessToken"];
      const decoded = await this.jwt.verifyToken(token);
      const email = decoded.email;
      const { currentPassword, newPassword } = req.body;
      const instructor = await this.service.getProfile(email);
      
      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: InstructorErrorMessages.INSTRUCTOR_NOT_FOUND,
        });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, instructor.password);

      if (!isMatch) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: InstructorErrorMessages.CURRENT_PASSWORD_INCORRECT,
        });
        return;
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      const updated = await this.service.updatePassword(email, hashed);

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
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: InstructorErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
