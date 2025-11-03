import { Request, Response } from "express";
import bcrypt from "bcrypt";
import IInstructorController from "./interfaces/IInstructorController";
import IInstructorService from "../../services/instructorServices/interface/IInstructorService";
import IOtpServices from "../../services/interface/IOtpService";
import { Roles, StatusCode } from "../../utils/enums";
import { INSTRUCTOR_MESSAGES } from "../../utils/constants";
import { IJwtService } from "../../services/interface/IJwtService";
import { IEmail } from "../../types/Email";
import { IOtpGenerate } from "../../types/types";
import {
  throwAppError,
  handleControllerError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "../../utils/errorHandlerUtil";
import { IInstructor } from "../../models/instructorModel";
import { JwtPayload } from "jsonwebtoken";


const getHeader = (req: Request, header: string): string => {
  const value = req.headers[header];
  if (typeof value !== "string") {
    throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.TOKEN_INVALID);
  }
  return value as string;
};

export class InstructorController implements IInstructorController {
  private _instructorService: IInstructorService;
  private _otpService: IOtpServices;
  private _otpGenerator: IOtpGenerate;
  private _jwt: IJwtService;
  private _emailSender: IEmail;

  constructor(
    instructorService: IInstructorService,
    otpService: IOtpServices,
    otpGenerateService: IOtpGenerate,
    jwtService: IJwtService,
    emailService: IEmail,
  ) {
    this._instructorService = instructorService;
    this._otpService = otpService;
    this._otpGenerator = otpGenerateService;
    this._jwt = jwtService;
    this._emailSender = emailService;
  }


  async signUp(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username } = req.body as {
        email: string;
        password: string;
        username: string;
      };

      if (!email || !password || !username)
        throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.EMAIL_PASSWORD_USERNAME_REQUIRED);

      const existingInstructor = await this._instructorService.findByEmail(email);
      if (existingInstructor) throwAppError(ConflictError, INSTRUCTOR_MESSAGES.USER_ALREADY_EXISTS);

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = await this._otpGenerator.createOtpDigit();
      const otpCreated = await this._otpService.createOtp(email, otp, 60);
      if (!otpCreated) throwAppError(InternalServerError, INSTRUCTOR_MESSAGES.FAILED_TO_CREATE_OTP);

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
    } catch (error) {
      console.log(error)
      handleControllerError(error, res);
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      if (!email) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.EMAIL_REQUIRED);

      const otpExists = await this._otpService.otpExists(email);
      if (otpExists) {
        const remainingTime = await this._otpService.getOtpRemainingTime(email);
        if (remainingTime !== null)
          throwAppError(
            BadRequestError,
            INSTRUCTOR_MESSAGES.WAIT_FOR_OTP.replace("{remainingTime}", remainingTime.toString())
          );
      }

      const otp = await this._otpGenerator.createOtpDigit();
      const otpCreated = await this._otpService.createOtp(email, otp, 60);
      if (!otpCreated) throwAppError(InternalServerError, INSTRUCTOR_MESSAGES.FAILED_TO_CREATE_OTP);

      await this._emailSender.sentEmailVerification("Instructor", email, otp);

      res.status(StatusCode.OK).json({ success: true, message: INSTRUCTOR_MESSAGES.OTP_SENT });
    } catch (error) {
      handleControllerError(error, res);
    }
  }

 async createUser(req: Request, res: Response): Promise<void> {
  try {
    const { otp } = req.body as { otp: string };
    const tokenHeader = getHeader(req, "the-verify-token");

    if (!otp) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.OTP_REQUIRED);

    const decodedRaw = await this._jwt.verifyToken(tokenHeader);

    // If token decoded to a string, it is invalid here
    if (typeof decodedRaw === "string") {
      throwAppError(UnauthorizedError, INSTRUCTOR_MESSAGES.TOKEN_INVALID);
    }

    // Cast decoded Raw to JwtPayload extended with id and email
    const decoded = decodedRaw as JwtPayload & { id?: string; email?: string };

    if (!decoded?.email) {
      throwAppError(UnauthorizedError, INSTRUCTOR_MESSAGES.TOKEN_INVALID);
      return;
    }

    // Verify OTP for the email
    const isValid = await this._otpService.verifyOtp(decoded.email, otp);
    if (!isValid) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.INCORRECT_OTP);

    if (!decoded.id) {
      throwAppError(UnauthorizedError, INSTRUCTOR_MESSAGES.TOKEN_INVALID);
      return;
    }

    // Find the full instructor user by decoded id
    const instructorFromDb: IInstructor | null = await this._instructorService.findById(decoded.id);
    if (!instructorFromDb) {
      throwAppError(NotFoundError, INSTRUCTOR_MESSAGES.USER_NOT_FOUND);
      return
    }

    const user = await this._instructorService.createUser(instructorFromDb);
    if (!user) throwAppError(InternalServerError, INSTRUCTOR_MESSAGES.FAILED_TO_RESET_PASSWORD);

    res.status(StatusCode.CREATED).json({
      success: true,
      message: INSTRUCTOR_MESSAGES.USER_CREATED,
      user,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      if (!email || !password) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.EMAIL_PASSWORD_USERNAME_REQUIRED);

      const instructor = await this._instructorService.findByEmail(email);
      if (!instructor){
        throwAppError(NotFoundError, INSTRUCTOR_MESSAGES.USER_NOT_FOUND);
        return
      }
      if (instructor.isBlocked) throwAppError(ForbiddenError, INSTRUCTOR_MESSAGES.INSTRUCTOR_BLOCKED);

      const valid = await bcrypt.compare(password, instructor.password);
      if (!valid) throwAppError(UnauthorizedError, INSTRUCTOR_MESSAGES.INVALID_CREDENTIALS);

      const accessToken = await this._jwt.accessToken({
        email,
        role: instructor.role,
        id: instructor._id,
      });
      const refreshToken = await this._jwt.refreshToken({
        email,
        role: instructor.role,
        id: instructor._id,
      });

      res
        .status(StatusCode.OK)
        .cookie("accessToken", accessToken, { httpOnly: true })
        .cookie("refreshToken", refreshToken, { httpOnly: true })
        .json({
          success: true,
          message: INSTRUCTOR_MESSAGES.LOGIN_SUCCESS,
          user: {
            id: instructor._id,
            email: instructor.email,
            username: instructor.username,
            role: instructor.role,
            isBlocked: instructor.isBlocked,
            isVerified: instructor.isVerified,
          },
        });
    } catch (error) {
      handleControllerError(error, res);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("accessToken", { httpOnly: true });
      res.clearCookie("refreshToken", { httpOnly: true });
      res.status(StatusCode.OK).json({ success: true, message: INSTRUCTOR_MESSAGES.LOGOUT_SUCCESS });
    } catch (error) {
      handleControllerError(error, res);
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      if (!email) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.EMAIL_REQUIRED);

      const existing = await this._instructorService.findByEmail(email);
      if (!existing){
        throwAppError(NotFoundError, INSTRUCTOR_MESSAGES.USER_NOT_FOUND);
        return
      }

      const otp = await this._otpGenerator.createOtpDigit();
      const created = await this._otpService.createOtp(email, otp, 60);
      if (!created) throwAppError(InternalServerError, INSTRUCTOR_MESSAGES.FAILED_TO_CREATE_OTP);

      await this._emailSender.sentEmailVerification("Instructor", email, otp);

      res.status(StatusCode.OK).json({
        success: true,
        message: INSTRUCTOR_MESSAGES.REDIERCTING_OTP_PAGE,
        data: { email: existing.email, username: existing.username },
      });
    } catch (error) {
      handleControllerError(error, res);
    }
  }

  async verifyResetOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body as { email: string; otp: string };
      if (!email || !otp)
        throwAppError(
          BadRequestError,
          `${INSTRUCTOR_MESSAGES.EMAIL_REQUIRED} and ${INSTRUCTOR_MESSAGES.OTP_REQUIRED}`
        );

      const valid = await this._otpService.verifyOtp(email, otp);
      if (!valid) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.INCORRECT_OTP);

      const token = await this._jwt.createToken({ email });
      res
        .status(StatusCode.OK)
        .cookie("forgotToken", token, { httpOnly: true })
        .json({ success: true, message: INSTRUCTOR_MESSAGES.REDIERCTING_PASSWORD_RESET_PAGE });
    } catch (error) {
      handleControllerError(error, res);
    }
  }

  async forgotResendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      if (!email) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.EMAIL_REQUIRED);

      const exists = await this._otpService.otpExists(email);
      if (exists) {
        const time = await this._otpService.getOtpRemainingTime(email);
        if (time !== null)
          throwAppError(
            BadRequestError,
            INSTRUCTOR_MESSAGES.WAIT_FOR_OTP.replace("{remainingTime}", time.toString())
          );
      }

      const otp = await this._otpGenerator.createOtpDigit();
      const created = await this._otpService.createOtp(email, otp, 60);
      if (!created) throwAppError(InternalServerError, INSTRUCTOR_MESSAGES.FAILED_TO_CREATE_OTP);

      await this._emailSender.sentEmailVerification("Instructor", email, otp);
      res.status(StatusCode.OK).json({ success: true, message: INSTRUCTOR_MESSAGES.OTP_SENT });
    } catch (error) {
      handleControllerError(error, res);
    }
  }
  
 async resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { password } = req.body as { password: string };
    if (!password) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.PASSWORD_REQUIRED);

    const token = req.cookies.forgotToken;
    if (!token) throwAppError(UnauthorizedError, INSTRUCTOR_MESSAGES.RESET_TOKEN_REQUIRED);

    const payloadRaw = await this._jwt.verifyToken(token);

    if (typeof payloadRaw === "string") {
      throwAppError(UnauthorizedError, INSTRUCTOR_MESSAGES.TOKEN_INVALID);
    }

    const payload = payloadRaw as JwtPayload & { email?: string, id?: string };

    if (!payload.email) {
      throwAppError(UnauthorizedError, INSTRUCTOR_MESSAGES.TOKEN_INVALID);
      return
    }

    const hashed = await bcrypt.hash(password, 10);
    const updated = await this._instructorService.resetPassword(payload.email, hashed);
    if (!updated) throwAppError(InternalServerError, INSTRUCTOR_MESSAGES.FAILED_TO_RESET_PASSWORD);

    await this._otpService.deleteOtp(payload.email);
    res.clearCookie("forgotToken", { httpOnly: true });
    res.status(StatusCode.OK).json({ success: true, message: INSTRUCTOR_MESSAGES.PASSWORD_RESET });
  } catch (error) {
    handleControllerError(error, res);
  }
}


  async doGoogleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body as { name: string; email: string };
      if (!name || !email) throwAppError(BadRequestError, INSTRUCTOR_MESSAGES.NAME_EMAIL_REQUIRED);

      const existing = await this._instructorService.findByEmail(email);

      let instructor: IInstructor;

      if (!existing) {
        const newInstructor = await this._instructorService.googleLogin(name, email);
        if (!newInstructor) {
          throwAppError(InternalServerError, INSTRUCTOR_MESSAGES.GOOGLE_LOGIN_FAILED);
          return; // Add return statement
        }
        instructor = newInstructor;
      } else {
        if (existing.isBlocked) throwAppError(ForbiddenError, INSTRUCTOR_MESSAGES.INSTRUCTOR_BLOCKED);
        instructor = existing;
      }

      const accessToken = await this._jwt.accessToken({
        email,
        id: instructor._id,
        role: instructor.role,
      });
      const refreshToken = await this._jwt.refreshToken({
        email,
        id: instructor._id,
        role: instructor.role,
      });

      res
        .status(StatusCode.OK)
        .cookie("accessToken", accessToken, { httpOnly: true })
        .cookie("refreshToken", refreshToken, { httpOnly: true })
        .json({
          success: true,
          message: INSTRUCTOR_MESSAGES.GOOGLE_LOGIN_SUCCESS,
          instructor: {
            id: instructor._id,
            email: instructor.email,
            username: instructor.username,
            role: instructor.role,
            isBlocked: instructor.isBlocked,
            isVerified: instructor.isVerified,
          },
        });
    } catch (error) {
      handleControllerError(error, res);
    }
  }
  
}