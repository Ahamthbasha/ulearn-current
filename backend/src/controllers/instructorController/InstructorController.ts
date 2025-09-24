import { Request, Response } from "express";
import bcrypt from "bcrypt";
import IInstructorController from "./interfaces/IInstructorController";
import IInstructorService from "../../services/instructorServices/interface/IInstructorService";
import IOtpServices from "../../services/interface/IOtpService";
import { Roles, StatusCode } from "../../utils/enums";
import { INSTRUCTOR_MESSAGES } from "../../utils/constants";
import { IJwtService } from "../../services/interface/IJwtService";
import { IEmail } from "../../types/Email";
import { IOtpGenerate } from "src/types/types";

export class InstructorController implements IInstructorController {
  private _instructorService: IInstructorService;
  private _otpService: IOtpServices;
  private _otpGenerator: IOtpGenerate;
  private _jwt: IJwtService;
  private _emailSender: IEmail;

  constructor(instructorService: IInstructorService, otpService: IOtpServices,otpGenerateService:IOtpGenerate,jwtService:IJwtService,emailService:IEmail) {
    this._instructorService = instructorService;
    this._otpService = otpService;
    this._otpGenerator = otpGenerateService;
    this._jwt = jwtService
    this._emailSender = emailService;
  }

  public async signUp(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username } = req.body;

      if (!email || !password || !username) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.EMAIL_PASSWORD_USERNAME_REQUIRED,
        });
        return;
      }

      const saltRound = 10;
      const hashedPassword = await bcrypt.hash(password, saltRound);

      const existingInstructor = await this._instructorService.findByEmail(email);

      if (existingInstructor) {
        res.status(StatusCode.CONFLICT).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.USER_ALREADY_EXISTS,
        });
        return;
      }

      const otp = await this._otpGenerator.createOtpDigit();
      const otpCreated = await this._otpService.createOtp(email, otp, 60);

      if (!otpCreated) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.FAILED_TO_CREATE_OTP,
        });
        return;
      }

      await this._emailSender.sentEmailVerification("Instructor", email, otp);

      const token = await this._jwt.createToken({
        email,
        password: hashedPassword,
        username,
        role: Roles.INSTRUCTOR,
      });

      res.status(StatusCode.CREATED).json({
        success: true,
        message: INSTRUCTOR_MESSAGES.SIGNUP_SUCCESS,
        token,
      });
    } catch (error: any) {
      console.error('SignUp Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.EMAIL_REQUIRED,
        });
        return;
      }

      const otpExists = await this._otpService.otpExists(email);
      if (otpExists) {
        const remainingTime = await this._otpService.getOtpRemainingTime(email);

        if(remainingTime){
          console.log(`Existing OTP found for ${email}, remaining time: ${remainingTime}`);
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: INSTRUCTOR_MESSAGES.WAIT_FOR_OTP.replace("{remainingTime}", remainingTime.toString()),
          });
        }
        return;
      }

      const otp = await this._otpGenerator.createOtpDigit();
      const otpCreated = await this._otpService.createOtp(email, otp, 60);

      if (!otpCreated) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.FAILED_TO_CREATE_OTP,
        });
        return;
      }

      await this._emailSender.sentEmailVerification("Instructor", email, otp);

      res.status(StatusCode.OK).json({
        success: true,
        message: INSTRUCTOR_MESSAGES.OTP_SENT,
      });
    } catch (error: any) {
      console.error('Resend OTP Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { otp } = req.body;
      const token = req.headers["the-verify-token"];

      if (!otp) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.OTP_REQUIRED,
        });
        return;
      }

      if (typeof token !== "string") {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.TOKEN_INVALID,
        });
        return;
      }

      const decode = await this._jwt.verifyToken(token);
      if (!decode || !decode.email) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.TOKEN_INVALID,
        });
        return;
      }

      const isOtpValid = await this._otpService.verifyOtp(decode.email, otp);

      if (isOtpValid) {
        const user = await this._instructorService.createUser(decode);
        if (user) {
          res.status(StatusCode.CREATED).json({
            success: true,
            message: INSTRUCTOR_MESSAGES.USER_CREATED,
            user,
          });
        } else {
          res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: INSTRUCTOR_MESSAGES.FAILED_TO_RESET_PASSWORD,
          });
        }
      } else {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.INCORRECT_OTP,
        });
      }
    } catch (error: any) {
      console.error('Create User Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.EMAIL_PASSWORD_USERNAME_REQUIRED, // Reused for simplicity
        });
        return;
      }

      const instructor = await this._instructorService.findByEmail(email);

      if (!instructor) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.USER_NOT_FOUND,
        });
        return;
      }

      if (instructor.isBlocked) {
        res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.INSTRUCTOR_BLOCKED,
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, instructor.password);

      if (!isPasswordValid) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.INVALID_CREDENTIALS,
        });
        return;
      }

      const role = instructor.role;
      const id = instructor._id;

      const accessToken = await this._jwt.accessToken({ email, role, id });
      const refreshToken = await this._jwt.refreshToken({ email, role, id });

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
          message: INSTRUCTOR_MESSAGES.LOGIN_SUCCESS,
          user: {
            id: instructor._id,
            email: instructor.email,
            username: instructor.username,
            role: instructor.role,
            isBlocked: instructor.isBlocked,
            isVerified:instructor.isVerified
          },
        });
    } catch (error: any) {
      console.error('Login Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("accessToken", {
        httpOnly: true,
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
      });

      res.status(StatusCode.OK).json({
        success: true,
        message: INSTRUCTOR_MESSAGES.LOGOUT_SUCCESS,
      });
    } catch (error: any) {
      console.error('Logout Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.EMAIL_REQUIRED,
        });
        return;
      }

      const existingUser = await this._instructorService.findByEmail(email);

      if (existingUser) {
        const otp = await this._otpGenerator.createOtpDigit();
        const otpCreated = await this._otpService.createOtp(email, otp, 60);

        if (!otpCreated) {
          res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: INSTRUCTOR_MESSAGES.FAILED_TO_CREATE_OTP,
          });
          return;
        }

        await this._emailSender.sentEmailVerification("Instructor", email, otp);

        res.status(StatusCode.OK).json({
          success: true,
          message: INSTRUCTOR_MESSAGES.REDIERCTING_OTP_PAGE,
          data: {
            email: existingUser.email,
            username: existingUser.username,
          },
        });
      } else {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.USER_NOT_FOUND,
        });
      }
    } catch (error: any) {
      console.error('Verify Email Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
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
          message: `${INSTRUCTOR_MESSAGES.EMAIL_REQUIRED} and ${INSTRUCTOR_MESSAGES.OTP_REQUIRED}`,
        });
        return;
      }

      const isOtpValid = await this._otpService.verifyOtp(email, otp);

      if (isOtpValid) {
        const token = await this._jwt.createToken({ email });

        res
          .status(StatusCode.OK)
          .cookie("forgotToken", token, {
            httpOnly: true,
          })
          .json({
            success: true,
            message: INSTRUCTOR_MESSAGES.REDIERCTING_PASSWORD_RESET_PAGE,
          });
      } else {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.INCORRECT_OTP,
        });
      }
    } catch (error: any) {
      console.error('Verify Reset OTP Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async forgotResendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.EMAIL_REQUIRED,
        });
        return;
      }

      const otpExists = await this._otpService.otpExists(email);
      if (otpExists) {
        const remainingTime = await this._otpService.getOtpRemainingTime(email);

        if(remainingTime){
          console.log(`Existing OTP found for ${email}, remaining time: ${remainingTime}`);
          res.status(StatusCode.BAD_REQUEST).json({
            success: false,
            message: INSTRUCTOR_MESSAGES.WAIT_FOR_OTP.replace("{remainingTime}", remainingTime.toString()),
          });
        }
        return;
      }

      const otp = await this._otpGenerator.createOtpDigit();
      const otpCreated = await this._otpService.createOtp(email, otp, 60);

      if (!otpCreated) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.FAILED_TO_CREATE_OTP,
        });
        return;
      }

      await this._emailSender.sentEmailVerification("Instructor", email, otp);

      res.status(StatusCode.OK).json({
        success: true,
        message: INSTRUCTOR_MESSAGES.OTP_SENT,
      });
    } catch (error: any) {
      console.error('Forgot Resend OTP Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.PASSWORD_REQUIRED,
        });
        return;
      }

      const token = req.cookies.forgotToken;

      if (!token) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.RESET_TOKEN_REQUIRED,
        });
        return;
      }

      const data = await this._jwt.verifyToken(token);
      if (!data || !data.email) {
        res.status(StatusCode.UNAUTHORIZED).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.TOKEN_INVALID,
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const passwordReset = await this._instructorService.resetPassword(data.email, hashedPassword);

      if (passwordReset) {
        await this._otpService.deleteOtp(data.email);
        res.clearCookie("forgotToken", {
          httpOnly: true,
        });
        res.status(StatusCode.OK).json({
          success: true,
          message: INSTRUCTOR_MESSAGES.PASSWORD_RESET,
        });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: INSTRUCTOR_MESSAGES.FAILED_TO_RESET_PASSWORD,
        });
      }
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
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
          message: INSTRUCTOR_MESSAGES.NAME_EMAIL_REQUIRED,
        });
        return;
      }

      const existingInstructor = await this._instructorService.findByEmail(email);

      if (!existingInstructor) {
        const instructor = await this._instructorService.googleLogin(name, email);

        if (instructor) {
          const role = instructor.role;
          const id = instructor._id;
          const accessToken = await this._jwt.accessToken({ email, id, role });
          const refreshToken = await this._jwt.refreshToken({ email, id, role });

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
              message: INSTRUCTOR_MESSAGES.GOOGLE_LOGIN_SUCCESS,
              instructor: {
                id: instructor._id,
                email: instructor.email,
                username: instructor.username,
                role: instructor.role,
                isBlocked:instructor.isBlocked,
                isVerified:instructor.isVerified
              },
            });
        } else {
          res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: INSTRUCTOR_MESSAGES.GOOGLE_LOGIN_FAILED,
          });
        }
      } else {
        if (existingInstructor.isBlocked) {
          res.status(StatusCode.FORBIDDEN).json({
            success: false,
            message: INSTRUCTOR_MESSAGES.INSTRUCTOR_BLOCKED,
          });
          return;
        }

        const role = existingInstructor.role;
        const id = existingInstructor._id;
        const accessToken = await this._jwt.accessToken({ email, id, role });
        const refreshToken = await this._jwt.refreshToken({ email, id, role });

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
            message: INSTRUCTOR_MESSAGES.GOOGLE_LOGIN_SUCCESS,
            instructor: {
              id: existingInstructor._id,
              email: existingInstructor.email,
              username: existingInstructor.username,
              role: existingInstructor.role,
              isBlocked:existingInstructor.isBlocked,
              isVerified:existingInstructor.isVerified
            },
          });
      }
    } catch (error: any) {
      console.error('Google Login Error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: INSTRUCTOR_MESSAGES.INTERNAL_SERVER_ERROR,
        error: error.message,
      });
    }
  }
}