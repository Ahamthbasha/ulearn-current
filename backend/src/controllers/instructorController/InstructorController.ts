import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { OtpGenerate } from "../../utils/otpGenerator";
import { JwtService } from "../../utils/jwt";

import IInstructorController from "./interfaces/IInstructorController";
import IInstructorService from "../../services/interface/IInstructorService";
import IOtpServices from "../../services/interface/IOtpService";

import {
  InstructorErrorMessages,
  InstructorSuccessMessages,
} from "../../utils/constants";

import { Roles, StatusCode } from "../../utils/enums";
import { SendEmail } from "../../utils/sendOtpEmail";
export class InstructorController implements IInstructorController {
  private instructorService: IInstructorService;
  private otpService: IOtpServices;
  private otpGenerator: OtpGenerate;
  private jwt: JwtService;
  private emailSender: SendEmail;

  constructor(instructorService: IInstructorService, otpService: IOtpServices) {
    this.instructorService = instructorService;
    this.otpService = otpService;
    this.otpGenerator = new OtpGenerate();
    this.jwt = new JwtService();
    this.emailSender = new SendEmail();
  }

  public async signUp(req: Request, res: Response): Promise<void> {
    try {
      let { email, password, username } = req.body;

      const saltRound = 10;
      const hashedPassword = await bcrypt.hash(password, saltRound);
      password = hashedPassword;

      const ExistingInstructor = await this.instructorService.findByEmail(
        email
      );

      if (ExistingInstructor) {
        res.json({
          success: false,
          message: InstructorErrorMessages.USER_ALREADY_EXISTS,
          user: ExistingInstructor,
        });
        return;
      } else {
        const otp = await this.otpGenerator.createOtpDigit();
        await this.otpService.createOtp(email, otp);
        await this.emailSender.sentEmailVerification("Instructor", email, otp);
        const JWT = new JwtService();
        const token = await JWT.createToken({
          email,
          password,
          username,
          role: Roles.INSTRUCTOR,
        });

        res.status(StatusCode.CREATED).json({
          success: true,
          message: InstructorSuccessMessages.SIGNUP_SUCCESS,
          token,
        });
        return;
      }
    } catch (error: any) {
      throw error;
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      let { email } = req.body;

      const otp = await this.otpGenerator.createOtpDigit();
      await this.otpService.createOtp(email, otp);
      await this.emailSender.sentEmailVerification("Instructor", email, otp);
      res.status(StatusCode.OK).json({
        success: true,
        message: InstructorSuccessMessages.OTP_SENT,
      });
    } catch (error: any) {
      throw error;
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { otp } = req.body;
      console.log(req.body);
      const token = req.headers["the-verify-token"] || "";

      if (typeof token != "string") {
        throw new Error();
      }
      const decode = await this.jwt.verifyToken(token);

      if (!decode) {
        throw new Error(InstructorErrorMessages.TOKEN_INVALID);
      }
      const resultOtp = await this.otpService.findOtp(decode.email);
      console.log(resultOtp);
      console.log(resultOtp?.otp, "<>", otp);
      if (resultOtp?.otp === otp) {
        const user = await this.instructorService.createUser(decode);
        if (user) {
          await this.otpService.deleteOtp(user.email);

          res.status(StatusCode.CREATED).json({
            success: true,
            message: InstructorSuccessMessages.USER_CREATED,
            user,
          });
          return;
        }
      } else {
        res.json({
          success: false,
          message: InstructorErrorMessages.INCORRECT_OTP,
        });
        return;
      }
    } catch (error: any) {
      throw error;
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Check if the instructor exists in the database
      const instructor = await this.instructorService.findByEmail(email);

      if (!instructor) {
        res.json({
          success: false,
          message: InstructorErrorMessages.USER_NOT_FOUND,
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        instructor.password
      );

      if (!isPasswordValid) {
        res.json({
          success: false,
          message: InstructorErrorMessages.INVALID_CREDENTIALS,
        });
        return;
      }
      if (instructor.isBlocked) {
        res.json({
          success: false,
          message: InstructorErrorMessages.INSTRUCTOR_BLOCKED,
        });
        return;
      }
      let role = instructor.role;
      let id = instructor._id;

      const accesstoken = await this.jwt.accessToken({ email, role, id });
      const refreshToken = await this.jwt.refreshToken({ email, role, id });

      const isProd = process.env.NODE_ENV === "production";
      res
        .status(StatusCode.OK)
        .cookie("accessToken", accesstoken, {
          httpOnly: true,
          sameSite: isProd ? "none" : "lax",
          secure: isProd,
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: isProd ? "none" : "lax",
          secure: isProd,
        })

        .send({
          success: true,
          message: InstructorSuccessMessages.LOGIN_SUCCESS,
          user: instructor,
          token: { accesstoken, refreshToken },
        });
    } catch (error: any) {
      throw error;
    }
  }

  async logout(_req: Request, res: Response) {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.status(StatusCode.OK).send({
        success: true,
        message: InstructorSuccessMessages.LOGOUT_SUCCESS,
      });
    } catch (error: any) {
      throw error;
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      let { email } = req.body;

      let existingUser = await this.instructorService.findByEmail(email);

      if (existingUser) {
        const otp = await this.otpGenerator.createOtpDigit();
        await this.otpService.createOtp(email, otp);
        await this.emailSender.sentEmailVerification("instructor", email, otp);
        res.send({
          success: true,
          message: InstructorSuccessMessages.REDIERCTING_OTP_PAGE,
          data: existingUser,
        });
      } else {
        res.send({
          success: false,
          message: InstructorErrorMessages.USER_NOT_FOUND,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async verifyResetOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const resultOtp = await this.otpService.findOtp(email);
      console.log(resultOtp?.otp, "<>", otp);

      if (resultOtp?.otp == otp) {
        let token = await this.jwt.createToken({ email });

        res.status(StatusCode.OK).cookie("forgotToken", token).json({
          success: true,
          message: InstructorSuccessMessages.REDIERCTING_PASSWORD_RESET_PAGE,
        });
      } else {
        res.json({
          success: false,
          message: InstructorErrorMessages.INCORRECT_OTP,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async forgotResendOtp(req: Request, res: Response): Promise<void> {
    try {
      let { email } = req.body;

      const otp = await this.otpGenerator.createOtpDigit();
      await this.otpService.createOtp(email, otp);
      await this.emailSender.sentEmailVerification("instructor", email, otp);

      res.status(StatusCode.OK).json({
        success: true,
        message: InstructorSuccessMessages.OTP_SENT,
      });
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { password } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const token = req.cookies.forgotToken;

      let data = await this.jwt.verifyToken(token);

      if (!data) {
        throw new Error(InstructorErrorMessages.TOKEN_INVALID);
      }

      const passwordReset = await this.instructorService.resetPassword(
        data.email,
        hashedPassword
      );

      if (passwordReset) {
        res.clearCookie("forgotToken");
        res.status(StatusCode.OK).json({
          success: true,
          message: InstructorSuccessMessages.PASSWORD_RESET,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async doGoogleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;
      const existingInstructor = await this.instructorService.findByEmail(
        email
      );

      if (!existingInstructor) {
        const instructor = await this.instructorService.googleLogin(
          name,
          email
        );

        if (instructor) {
          const role = instructor.role;
          const id = instructor._id;
          const accessToken = await this.jwt.accessToken({ email, id, role });
          const refreshToken = await this.jwt.refreshToken({ email, id, role });

          res
            .status(StatusCode.OK)
            .cookie("accessToken", accessToken, { httpOnly: true })
            .cookie("refreshToken", refreshToken, { httpOnly: true })
            .json({
              success: true,
              message: InstructorSuccessMessages.GOOGLE_LOGIN_SUCCESS,
              instructor: instructor,
            });
        }
      } else {
        if (!existingInstructor.isBlocked) {
          const role = existingInstructor.role;
          const id = existingInstructor._id;
          const accessToken = await this.jwt.accessToken({ email, id, role });
          const refreshToken = await this.jwt.refreshToken({ email, id, role });

          res
            .status(StatusCode.OK)
            .cookie("accessToken", accessToken, { httpOnly: true })
            .cookie("refreshToken", refreshToken, { httpOnly: true })
            .json({
              sucess: true,
              message: InstructorSuccessMessages.GOOGLE_LOGIN_SUCCESS,
              instructor: existingInstructor,
            });
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async statusCheck(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies.accessToken;
      const decoded = await this.jwt.verifyToken(token);

      if (!decoded?.email) {
        res
          .status(StatusCode.UNAUTHORIZED)
          .json({ success: false, message: "Invalid token" });
        return;
      }

      const instructor = await this.instructorService.findByEmail(
        decoded.email
      );

      if (!instructor) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ success: false, message: "Instructor not found" });
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          isBlocked: instructor.isBlocked,
        },
      });
    } catch (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Status check failed",
      });
    }
  }
}
