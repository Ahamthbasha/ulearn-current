import { Request, Response } from "express";
import IStudentController from "./interfaces/IStudentController";
import IStudentService from "../../services/studentServices/interface/IStudentService";
import IOtpServices from "../../services/interface/IOtpService";
import { OtpGenerate } from "../../utils/otpGenerator";
import { JwtService } from "../../utils/jwt";
import bcrypt from "bcrypt";
import {
  SERVER_ERROR,
  StudentErrorMessages,
  StudentSuccessMessages,
} from "../../utils/constants";
import { Roles, StatusCode } from "../../utils/enums";
import { SendEmail } from "../../utils/sendOtpEmail";
export class StudentController implements IStudentController {
  private _studentService: IStudentService;
  private _otpService: IOtpServices;
  private _otpGenerator: OtpGenerate;
  private _JWT: JwtService;
  private _emailSender: SendEmail;

  constructor(studentService: IStudentService, otpService: IOtpServices) {
    this._studentService = studentService;
    this._otpService = otpService;
    this._otpGenerator = new OtpGenerate();
    this._JWT = new JwtService();
    this._emailSender = new SendEmail();
  }

  async studentSignUp(req: Request, res: Response): Promise<any> {
    try {
      let { email, password, username } = req.body;

      const saltRound = 10;
      const hashedPassword = await bcrypt.hash(password, saltRound);
      password = hashedPassword;

      const ExistingStudent = await this._studentService.findByEmail(email);

      if (ExistingStudent) {
        return res.json({
          success: false,
          message: StudentErrorMessages.USER_ALREADY_EXISTS,
          user: ExistingStudent,
        });
      } else {
        const otp = await this._otpGenerator.createOtpDigit();

        await this._otpService.createOtp(email, otp);

        await this._emailSender.sentEmailVerification("Student", email, otp);

        const token = await this._JWT.createToken({
          email,
          password,
          username,
          role: Roles.STUDENT,
        });

        return res.status(StatusCode.CREATED).json({
          success: true,
          message: StudentSuccessMessages.SIGNUP_SUCCESS,
          token,
        });
      }
    } catch (error: any) {
      console.error(error);
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

      const otp = await this._otpGenerator.createOtpDigit();
      await this._otpService.createOtp(email, otp);
      await this._emailSender.sentEmailVerification("Student", email, otp);

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.OTP_SENT,
      });
    } catch (error: any) {
      throw error;
    }
  }

  async createUser(req: Request, res: Response): Promise<any> {
    try {
      const { otp } = req.body;

      const token = req.headers["the-verify-token"] || "";
      if (typeof token != "string") {
        throw new Error();
      }
      const decode = await this._JWT.verifyToken(token);
      if (!decode) {
        return new Error(StudentErrorMessages.TOKEN_INVALID);
      }
      const resultOtp = await this._otpService.findOtp(decode.email);
      console.log(resultOtp?.otp, "<>", otp);
      if (resultOtp?.otp === otp) {
        const user = await this._studentService.createUser(decode);

        if (user) {
          await this._otpService.deleteOtp(user.email);

          return res.status(StatusCode.CREATED).json({
            success: true,
            message: StudentSuccessMessages.USER_CREATED,
            user,
          });
        }
      } else {
        return res.json({
          success: false,
          message: StudentErrorMessages.INCORRECT_OTP,
        });
      }
    } catch (error: any) {
      throw error;
    }
  }

  async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;
      console.log(req.body);
      const student = await this._studentService.findByEmail(email);

      if (!student) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.INVALID_CREDENTIALS,
        });
      }

      // ✅ Block check
      if (student.isBlocked) {
        return res.status(StatusCode.FORBIDDEN).json({
          success: false,
          message: StudentErrorMessages.ACCOUNT_BLOCKED,
        });
      }

      const passwordMatch = await bcrypt.compare(password, student.password);

      if (!passwordMatch) {
        return res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: StudentErrorMessages.INVALID_CREDENTIALS,
        });
      }

      const role = student.role;
      const id = student.id;

      const accessToken = await this._JWT.accessToken({ id, role, email });
      const refreshToken = await this._JWT.refreshToken({ id, role, email });

      console.log("ACCESS TOKEN:", accessToken);
      console.log("REFRESH TOKEN:", refreshToken);

      return res
        .status(StatusCode.OK)
        .cookie("accessToken", accessToken, { httpOnly: true,secure:true,
              sameSite:"none" })
        .cookie("refreshToken", refreshToken, { httpOnly: true,secure:true,
              sameSite:"none" })
        .send({
          success: true,
          message: StudentSuccessMessages.LOGIN_SUCCESS,
          user: student,
        });
    } catch (error) {
      throw error;
    }
  }

  async logout(_req: Request, res: Response) {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      console.log("user is logged out");
      res
        .status(StatusCode.OK)
        .send({
          success: true,
          message: StudentSuccessMessages.LOGOUT_SUCCESS,
        });
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      let { email } = req.body;

      const existingUser = await this._studentService.findByEmail(email);

      if (existingUser) {
        const otp = await this._otpGenerator.createOtpDigit();

        await this._otpService.createOtp(email, otp);
        console.log("verifyEmail otp ");
        await this._emailSender.sentEmailVerification("Student", email, otp);
        console.log("verifyEmail otp is sended");

        res.send({
          success: true,
          message: StudentSuccessMessages.REDIERCTING_OTP_PAGE,
          data: existingUser,
        });
      } else {
        res.send({
          success: false,
          message: StudentErrorMessages.USER_NOT_FOUND,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async verifyResetOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      const resultOtp = await this._otpService.findOtp(email);

      console.log(resultOtp?.otp, "==", otp);

      if (resultOtp?.otp === otp) {
        let token = await this._JWT.createToken({ email });

        res.status(StatusCode.OK).cookie("forgotToken", token).json({
          success: true,
          message: StudentSuccessMessages.REDIERCTING_PASSWORD_RESET_PAGE,
        });
      } else {
        res.json({
          success: false,
          message: StudentErrorMessages.INCORRECT_OTP,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async forgotResendOtp(req: Request, res: Response): Promise<void> {
    try {
      let { email } = req.body;

      let otp = await this._otpGenerator.createOtpDigit();
      await this._otpService.createOtp(email, otp);

      console.log("forgotResendOtp controller in student");

      await this._emailSender.sentEmailVerification("student", email, otp);

      console.log("forgotResendOtp controller in student otp sended");

      res.status(StatusCode.OK).json({
        success: true,
        message: StudentSuccessMessages.OTP_SENT,
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
      let data = await this._JWT.verifyToken(token);
      if (!data) {
        throw new Error(StudentErrorMessages.TOKEN_INVALID);
      }

      const passwordReset = await this._studentService.resetPassword(
        data.email,
        hashedPassword
      );
      if (passwordReset) {
        res.clearCookie("forgotToken");
        res.status(StatusCode.OK).json({
          success: true,
          message: StudentSuccessMessages.PASSWORD_RESET,
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async doGoogleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;
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
            .cookie("accessToken", accessToken, { httpOnly: true,
              secure:true,
              sameSite:"none"
             })
            .cookie("refreshToken", refreshToken, { httpOnly: true,secure:true,
              sameSite:"none" })
            .json({
              success: true,
              message: StudentSuccessMessages.GOOGLE_LOGIN_SUCCESS,
              user,
            });
        }
      } else {
        if (!existingUser.isBlocked) {
          const role = existingUser.role;
          const id = existingUser._id;
          const accessToken = await this._JWT.accessToken({ id, email, role });
          const refreshToken = await this._JWT.refreshToken({ id, email, role });

          res
            .status(StatusCode.OK)
            .cookie("accessToken", accessToken, { httpOnly: true,secure:true,
              sameSite:"none" })
            .cookie("refreshToken", refreshToken, { httpOnly: true,secure:true,
              sameSite:"none"})
            .json({
              success: true,
              message: StudentSuccessMessages.GOOGLE_LOGIN_SUCCESS,
              user: existingUser,
            });
        } else {
          res.status(StatusCode.OK).json({
            success: false,
            message: StudentErrorMessages.INTERNAL_SERVER_ERROR,
            user: existingUser,
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
      console.log("token",req.cookies)
      const decoded = await this._JWT.verifyToken(token);

      if (!decoded?.email) {
        res
          .status(StatusCode.UNAUTHORIZED)
          .json({ success: false, message: StudentErrorMessages.INVALID_TOKEN });
        return;
      }

      const student = await this._studentService.findByEmail(decoded.email);

      if (!student) {
        res
          .status(StatusCode.NOT_FOUND)
          .json({ success: false, message: StudentErrorMessages.NOT_FOUND_STUDENT});
        return;
      }

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          isBlocked: student.isBlocked,
        },
      });
    } catch (err) {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: StudentErrorMessages.STATUS_CHECK_FAILED,
      });
    }
  }
}