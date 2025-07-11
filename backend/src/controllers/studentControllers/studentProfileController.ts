// import { Request, Response } from 'express';
// import { IStudentProfileService } from '../../services/interface/IStudentProfileService';
// import { IStudentProfileController } from './interfaces/IStudentProfileController';
// import { uploadToS3Bucket } from '../../utils/s3Bucket';
// import { JwtService } from '../../utils/jwt';
// import bcrypt from 'bcrypt';
// import {StatusCode} from '../../utils/enums';
// import {
//   StudentSuccessMessages,
//   StudentErrorMessages,
// } from '../../utils/constants';
// import { getPresignedUrl } from '../../utils/getPresignedUrl';

// export class StudentProfileController implements IStudentProfileController {
//   private studentProfileService: IStudentProfileService;
//   private JWT: JwtService;

//   constructor(studentProfileService: IStudentProfileService) {
//     this.studentProfileService = studentProfileService;
//     this.JWT = new JwtService();
//   }


//   public async getProfile(req: Request, res: Response): Promise<void> {
//   try {
//     const token = req.cookies['accessToken'];
//     const decoded = await this.JWT.verifyToken(token);
//     console.log('decoded',decoded)
//     const student = await this.studentProfileService.getProfile(decoded.email);

//     if (!student) {
//       res.status(StatusCode.NOT_FOUND).json({
//         success: false,
//         message: StudentErrorMessages.STUDENT_NOT_FOUND,
//       });
//       return;
//     }

//     // ✅ Construct full S3 URL if profilePicUrl is present
//     let profilePicUrl = student.profilePicUrl
    
//       profilePicUrl =profilePicUrl ? await getPresignedUrl(profilePicUrl) : undefined

//     res.status(StatusCode.OK).json({
//       success: true,
//       message: StudentSuccessMessages.PROFILE_FETCHED,
//       data: {
//         ...student.toObject(),
//         profilePicUrl, // ✅ this will be used in frontend
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(StatusCode.UNAUTHORIZED).json({
//       success: false,
//       message: StudentErrorMessages.TOKEN_INVALID,
//     });
//   }
// }


//   // 🔹 UPDATE PROFILE

//   public async updateProfile(req: Request, res: Response): Promise<void> {
//   try {
//     const token = req.cookies['accessToken'];
//     const decoded = await this.JWT.verifyToken(token);
//     const userId = decoded.id;
    
//     const { username, skills, expertise, currentStatus } = req.body;

//     let profilePicUrl;
//     if (req.file) {
//       profilePicUrl = await uploadToS3Bucket(req.file, 'students');
//     }

//     // Parse skills and expertise safely
//     const parsedSkills = skills ? JSON.parse(skills) : [];
//     const parsedExpertise = expertise ? JSON.parse(expertise) : [];

//     // Only allow whitelisted fields to be updated
//     const updateData: any = {
//       ...(username && { username }),
//       ...(parsedSkills && { skills: parsedSkills }),
//       ...(parsedExpertise && { expertise: parsedExpertise }),
//       ...(currentStatus && { currentStatus }),
//       ...(profilePicUrl && { profilePicUrl }),
//     };
    
//     const updatedStudent = await this.studentProfileService.updateProfile(userId, updateData);

//     if (!updatedStudent) {
//       res.status(StatusCode.BAD_REQUEST).json({
//         success: false,
//         message: StudentErrorMessages.PROFILE_UPDATE_FAILED,
//       });
//       return;
//     }

//     res.status(StatusCode.OK).json({
//       success: true,
//       message: StudentSuccessMessages.PROFILE_UPDATED,
//       data: updatedStudent,
//     });
//   } catch (error) {
//     res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: StudentErrorMessages.INTERNAL_ERROR,
//     });
//   }
// }


//   // 🔹 UPDATE PASSWORD
//   public async updatePassword(req: Request, res: Response): Promise<void> {
//     try {
//       const token = req.cookies['accessToken'];
//       const decoded = await this.JWT.verifyToken(token);
//       const email = decoded.email;

//       const { currentPassword, newPassword } = req.body;
//       const student = await this.studentProfileService.getProfile(email);

//       if (!student) {
//         res.status(StatusCode.NOT_FOUND).json({
//           success: false,
//           message: StudentErrorMessages.STUDENT_NOT_FOUND,
//         });
//         return;
//       }

//       const isMatch = await bcrypt.compare(currentPassword, student.password);
//       if (!isMatch) {
//         res.status(StatusCode.BAD_REQUEST).json({
//           success: false,
//           message: StudentErrorMessages.CURRENT_PASSWORD_INCORRECT,
//         });
//         return;
//       }

//       const hashedPassword = await bcrypt.hash(newPassword, 10);
//       const isUpdated = await this.studentProfileService.updatePassword(email, hashedPassword);

//       if (!isUpdated) {
//         res.status(StatusCode.BAD_REQUEST).json({
//           success: false,
//           message: StudentErrorMessages.PASSWORD_UPDATE_FAILED,
//         });
//         return;
//       }

//       res.status(StatusCode.OK).json({
//         success: true,
//         message: StudentSuccessMessages.PASSWORD_UPDATED,
//       });
//     } catch (error) {
//       res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
//         success: false,
//         message: StudentErrorMessages.INTERNAL_ERROR,
//       });
//     }
//   }
// }


import { Response } from "express";
import { IStudentProfileService } from "../../services/interface/IStudentProfileService";
import { IStudentProfileController } from "./interfaces/IStudentProfileController";
import { uploadToS3Bucket } from "../../utils/s3Bucket";
import { StatusCode } from "../../utils/enums";
import {
  StudentSuccessMessages,
  StudentErrorMessages,
} from "../../utils/constants";
import { getPresignedUrl } from "../../utils/getPresignedUrl";
import bcrypt from "bcrypt";
import { AuthenticatedRequest } from "../../middlewares/AuthenticatedRoutes";

export class StudentProfileController implements IStudentProfileController {
  private studentProfileService: IStudentProfileService;

  constructor(studentProfileService: IStudentProfileService) {
    this.studentProfileService = studentProfileService;
  }

  // ✅ GET PROFILE
  public async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const email = req.user?.email;
      if(!email){
        res.status(StatusCode.UNAUTHORIZED).json({
    success: false,
    message: StudentErrorMessages.TOKEN_INVALID,
  });
        return
      }
      const student = await this.studentProfileService.getProfile(email);

      if (!student) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.STUDENT_NOT_FOUND,
        });
        return;
      }

      const profilePicUrl = student.profilePicUrl
        ? await getPresignedUrl(student.profilePicUrl)
        : undefined;

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.PROFILE_FETCHED,
        data: {
          ...student.toObject(),
          profilePicUrl,
        },
      });
    } catch (error) {
      console.error("getProfile error:", error);
      res.status(StatusCode.UNAUTHORIZED).json({
        success: false,
        message: StudentErrorMessages.TOKEN_INVALID,
      });
    }
  }

  // ✅ UPDATE PROFILE
  public async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id

      if(!userId){
        res.status(StatusCode.UNAUTHORIZED).json({
    success: false,
    message: StudentErrorMessages.TOKEN_INVALID,
        });
        return
      }
      const { username, skills, expertise, currentStatus } = req.body;

      let profilePicUrl;
      if (req.file) {
        profilePicUrl = await uploadToS3Bucket(req.file, "students");
      }

      const parsedSkills = skills ? JSON.parse(skills) : [];
      const parsedExpertise = expertise ? JSON.parse(expertise) : [];

      const updateData: any = {
        ...(username && { username }),
        ...(parsedSkills && { skills: parsedSkills }),
        ...(parsedExpertise && { expertise: parsedExpertise }),
        ...(currentStatus && { currentStatus }),
        ...(profilePicUrl && { profilePicUrl }),
      };

      const updatedStudent = await this.studentProfileService.updateProfile(
        userId,
        updateData
      );

      if (!updatedStudent) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.PROFILE_UPDATE_FAILED,
        });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.PROFILE_UPDATED,
        data: updatedStudent,
      });
    } catch (error) {
      console.error("updateProfile error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.INTERNAL_ERROR,
      });
    }
  }

  // ✅ UPDATE PASSWORD
  public async updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const email = req.user?.email;
      if(!email){
         res.status(StatusCode.UNAUTHORIZED).json({
    success: false,
    message: StudentErrorMessages.TOKEN_INVALID,
  });
        return
      }
      const { currentPassword, newPassword } = req.body;

      const student = await this.studentProfileService.getProfile(email);

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
      const isUpdated = await this.studentProfileService.updatePassword(
        email,
        hashedPassword
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
      console.error("updatePassword error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.INTERNAL_ERROR,
      });
    }
  }
}
