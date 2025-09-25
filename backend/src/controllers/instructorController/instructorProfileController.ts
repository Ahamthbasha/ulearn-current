import { Request, Response } from "express";
import { IInstructorProfileService } from "../../services/instructorServices/interface/IInstructorProfileService";
import { IInstructorProfileController } from "./interfaces/IInstructorProfileController";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import bcrypt from "bcrypt";
import { StatusCode } from "../../utils/enums";
import {
  InstructorErrorMessages,
  InstructorSuccessMessages,
} from "../../utils/constants";
import { IJwtService } from "../../services/interface/IJwtService";

export class InstructorProfileController
  implements IInstructorProfileController
{
  private _profileService: IInstructorProfileService;
  private _jwt: IJwtService;

  constructor(
    profileService: IInstructorProfileService,
    jwtService: IJwtService,
  ) {
    this._profileService = profileService;
    this._jwt = jwtService;
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies["accessToken"];
      const decoded = await this._jwt.verifyToken(token);

      const instructorProfile = await this._profileService.getProfile(
        decoded.email,
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
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: InstructorErrorMessages.TOKEN_INVALID,
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies["accessToken"];
      const decoded = await this._jwt.verifyToken(token);
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

      const updatedProfile = await this._profileService.updateProfile(
        userId,
        updateData,
      );

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
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: InstructorErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies["accessToken"];
      const decoded = await this._jwt.verifyToken(token);
      const email = decoded.email;
      const { currentPassword, newPassword } = req.body;

      // Use raw data for password comparison
      const instructor = await this._profileService.getInstructorRaw(email);

      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: InstructorErrorMessages.INSTRUCTOR_NOT_FOUND,
        });
        return;
      }

      const isMatch = await bcrypt.compare(
        currentPassword,
        instructor.password,
      );

      if (!isMatch) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: InstructorErrorMessages.CURRENT_PASSWORD_INCORRECT,
        });
        return;
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      const updated = await this._profileService.updatePassword(email, hashed);

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

  async updateBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies["accessToken"];
      const decoded = await this._jwt.verifyToken(token);
      const userId = decoded.id;

      const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

      const bankAccountData = {
        bankAccount: {
          ...(accountHolderName && { accountHolderName }),
          ...(accountNumber && { accountNumber }),
          ...(ifscCode && { ifscCode }),
          ...(bankName && { bankName }),
        },
      };

      const updatedProfile = await this._profileService.updateProfile(
        userId,
        bankAccountData,
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
        data: updatedProfile, // Now returning the updated profile data
      });
    } catch (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: InstructorErrorMessages.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
