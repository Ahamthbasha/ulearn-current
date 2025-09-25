import { Request, Response } from "express";
import IStudentController from "./interfaces/IStudentController";
import IStudentService from "../../services/studentServices/interface/IStudentService";
import bcrypt from "bcrypt";
import {
  SERVER_ERROR,
  StudentErrorMessages,
  MESSAGES,
} from "../../utils/constants";
import { Roles, StatusCode } from "../../utils/enums";
import IOtpServices from "../../services/interface/IOtpService";
import { IOtpGenerate } from "../../types/types";
import { IJwtService } from "../../services/interface/IJwtService";
import { IEmail } from "../../types/Email";

export class StudentController implements IStudentController {
  private _studentService: IStudentService;
  private _otpService: IOtpServices;
  private _otpGenerator: IOtpGenerate;
  private _JWT: IJwtService;
  private _emailSender: IEmail;

  constructor(
    studentService: IStudentService,
    otpService: IOtpServices,
    otpGenerateService: IOtpGenerate,
    jwtService: IJwtService,
    emailService: IEmail,
  ) {
    this._studentService = studentService;
    this._otpService = otpService;
    this._otpGenerator = otpGenerateService;
    this._JWT = jwtService;
    this._emailSender = emailService;
  }

  async studentSignUp(req: Request, res: Response): Promise<any> {
    try {
      let { email, password, username } = req.body;

      if (!email || !password || !username) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: `${MESSAGES.EMAIL_REQUIRED}, ${MESSAGES.PASSWORD_REQUIRED}, and ${MESSAGES.USERNAME_REQUIRED}`,
        });
      }

      const saltRound = 10;
      const hashedPassword = await bcrypt.hash(password, saltRound);
      password = hashedPassword;

      const existingStudent = await this._studentService.findByEmail(email);

      if (existingStudent) {
        return res.status(StatusCode.CONFLICT).json({
          success: false,
          message: MESSAGES.USER_ALREADY_EXISTS,
        });
      } else {
        const otp = await this._otpGenerator.createOtpDigit();

        // Create OTP with 60 seconds expiration
        const otpCreated = await this._otpService.createOtp(email, otp, 60);

        if (!otpCreated) {
          return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.FAILED_TO_CREATE_OTP,
          });
        }

        await this._emailSender.sentEmailVerification("Student", email, otp);

        const token = await this._JWT.createToken({
          email,
          password,
          username,
          role: Roles.STUDENT,
        });

        return res.status(StatusCode.CREATED).json({
          success: true,
          message: MESSAGES.SIGNUP_SUCCESS,
          token,
        });
      }
    } catch (error: any) {
      console.error("Student SignUp Error:", error);
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async resendOtp(req: Request, res: Response): Promise<any> {
    try {
      let { email } = req.body;

      if (!email) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.EMAIL_REQUIRED,
        });
      }

      // Check if there's an existing OTP
      const existingOtp = await this._otpService.otpExists(email);
      if (existingOtp) {
        const remainingTime = await this._otpService.getOtpRemainingTime(email);
        console.log(
          `Existing OTP found for ${email}, remaining time: ${remainingTime}`,
        );
      }

      const otp = await this._otpGenerator.createOtpDigit();
      const otpCreated = await this._otpService.createOtp(email, otp, 60);

      if (!otpCreated) {
        return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: MESSAGES.FAILED_TO_CREATE_OTP,
        });
      }

      await this._emailSender.sentEmailVerification("Student", email, otp);

      res.status(StatusCode.OK).json({
        success: true,
        message: MESSAGES.OTP_SENT,
      });
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async createUser(req: Request, res: Response): Promise<any> {
    try {
      const { otp } = req.body;

      if (!otp) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.OTP_REQUIRED,
        });
      }

      const token = req.headers["the-verify-token"] || "";
      if (typeof token != "string") {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: StudentErrorMessages.TOKEN_INVALID,
        });
      }

      const decode = await this._JWT.verifyToken(token);
      if (!decode || !decode.email) {
        return res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: StudentErrorMessages.TOKEN_INVALID,
        });
      }

      // Use the Redis OTP verification
      const isOtpValid = await this._otpService.verifyOtp(decode.email, otp);

      if (isOtpValid) {
        const user = await this._studentService.createUser(decode);

        if (user) {
          return res.status(StatusCode.CREATED).json({
            success: true,
            message: MESSAGES.USER_CREATED,
            user,
          });
        } else {
          return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.FAILED_TO_RESET_PASSWORD,
          });
        }
      } else {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.INCORRECT_OTP,
        });
      }
    } catch (error: any) {
      console.error("Create User Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: `${MESSAGES.EMAIL_REQUIRED} and ${MESSAGES.PASSWORD_REQUIRED}`,
        });
      }

      const student = await this._studentService.findByEmail(email);

      if (!student) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: MESSAGES.INVALID_CREDENTIALS,
        });
      }

      // Block check
      if (student.isBlocked) {
        return res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: MESSAGES.ACCOUNT_BLOCKED,
        });
      }

      const passwordMatch = await bcrypt.compare(password, student.password);

      if (!passwordMatch) {
        return res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.INVALID_CREDENTIALS,
        });
      }

      const role = student.role;
      const id = student.id;

      const accessToken = await this._JWT.accessToken({ id, role, email });
      const refreshToken = await this._JWT.refreshToken({ id, role, email });

      return res
        .status(StatusCode.OK)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
        })
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
        })
        .json({
          success: true,
          message: MESSAGES.LOGIN_SUCCESS,
          user: {
            id: student.id,
            email: student.email,
            username: student.username,
            role: student.role,
            isBlocked: student.isBlocked,
          },
        });
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async logout(_req: Request, res: Response): Promise<any> {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.status(StatusCode.OK).json({
        success: true,
        message: MESSAGES.LOGOUT_SUCCESS,
      });
    } catch (error: any) {
      console.error("Logout Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      let { email } = req.body;

      if (!email) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.EMAIL_REQUIRED,
        });
        return;
      }

      const existingUser = await this._studentService.findByEmail(email);

      if (existingUser) {
        const otp = await this._otpGenerator.createOtpDigit();

        const otpCreated = await this._otpService.createOtp(email, otp, 60);

        if (!otpCreated) {
          res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: MESSAGES.FAILED_TO_CREATE_OTP,
          });
          return;
        }

        await this._emailSender.sentEmailVerification("Student", email, otp);

        res.status(StatusCode.OK).json({
          success: true,
          message: MESSAGES.REDIERCTING_OTP_PAGE,
          data: {
            email: existingUser.email,
            username: existingUser.username,
          },
        });
      } else {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: MESSAGES.USER_NOT_FOUND,
        });
      }
    } catch (error: any) {
      console.error("Verify Email Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async verifyResetOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: `${MESSAGES.EMAIL_REQUIRED} and ${MESSAGES.OTP_REQUIRED}`,
        });
        return;
      }

      const isOtpValid = await this._otpService.verifyOtp(email, otp);

      console.log("isOtpValid", isOtpValid);

      if (isOtpValid) {
        let token = await this._JWT.createToken({ email });

        res
          .status(StatusCode.OK)
          .cookie("forgotToken", token, {
            httpOnly: true,
          })
          .json({
            success: true,
            message: MESSAGES.REDIERCTING_PASSWORD_RESET_PAGE,
          });
      } else {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.INCORRECT_OTP,
        });
      }
    } catch (error: any) {
      console.error("Verify Reset OTP Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async forgotResendOtp(req: Request, res: Response): Promise<void> {
    try {
      let { email } = req.body;

      if (!email) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.EMAIL_REQUIRED,
        });
        return;
      }

      let otp = await this._otpGenerator.createOtpDigit();
      const otpCreated = await this._otpService.createOtp(email, otp, 60);

      if (!otpCreated) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: MESSAGES.FAILED_TO_CREATE_OTP,
        });
        return;
      }

      await this._emailSender.sentEmailVerification("Student", email, otp);

      res.status(StatusCode.OK).json({
        success: true,
        message: MESSAGES.OTP_SENT,
      });
    } catch (error: any) {
      console.error("Forgot Resend OTP Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { password } = req.body;
      console.log(password);
      if (!password) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.PASSWORD_REQUIRED,
        });
        return;
      }

      const token = req.cookies.forgotToken;

      console.log(req.cookies.forgotToken);

      if (!token) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.RESET_TOKEN_REQUIRED,
        });
        return;
      }

      let data = await this._JWT.verifyToken(token);
      if (!data || !data.email) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: StudentErrorMessages.TOKEN_INVALID,
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const passwordReset = await this._studentService.resetPassword(
        data.email,
        hashedPassword,
      );

      if (passwordReset) {
        res.clearCookie("forgotToken");
        res.status(StatusCode.OK).json({
          success: true,
          message: MESSAGES.PASSWORD_RESET,
        });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: MESSAGES.FAILED_TO_RESET_PASSWORD,
        });
      }
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async doGoogleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.NAME_REQUIRED,
        });
        return;
      }

      const existingUser = await this._studentService.findByEmail(email);

      if (!existingUser) {
        const user = await this._studentService.googleLogin(name, email);

        if (user) {
          const role = user.role;
          const accessToken = await this._JWT.accessToken({
            id: user._id,
            email,
            role,
          });
          const refreshToken = await this._JWT.refreshToken({
            id: user._id,
            email,
            role,
          });

          res
            .status(StatusCode.OK)
            .cookie("accessToken", accessToken, {
              httpOnly: true,
            })
            .cookie("refreshToken", refreshToken, {
              httpOnly: true,
            })
            .json({
              success: true,
              message: MESSAGES.GOOGLE_LOGIN_SUCCESS,
              user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
              },
            });
        }
      } else {
        if (!existingUser.isBlocked) {
          const role = existingUser.role;
          const id = existingUser._id;
          const accessToken = await this._JWT.accessToken({ id, email, role });
          const refreshToken = await this._JWT.refreshToken({
            id,
            email,
            role,
          });

          res
            .status(StatusCode.OK)
            .cookie("accessToken", accessToken, {
              httpOnly: true,
            })
            .cookie("refreshToken", refreshToken, {
              httpOnly: true,
            })
            .json({
              success: true,
              message: MESSAGES.GOOGLE_LOGIN_SUCCESS,
              user: {
                id: existingUser._id,
                email: existingUser.email,
                username: existingUser.username,
                role: existingUser.role,
              },
            });
        } else {
          res.status(StatusCode.FORBIDDEN).json({
            success: false,
            message: MESSAGES.ACCOUNT_BLOCKED,
          });
        }
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: SERVER_ERROR.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }
}
