import { Response, NextFunction } from "express";
import { StatusCode, Roles } from "../utils/enums";
import { AuthErrorMsg } from "../utils/constants";
import { StudentRepository } from "../repositories/studentRepository/studentRepository";
import InstructorRepository from "../repositories/instructorRepository/instructorRepository";
import { AuthenticatedRequest } from "./authenticatedRoutes";
import { appLogger } from "../utils/logger";

export const restrictBlockedUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res
        .status(StatusCode.UNAUTHORIZED)
        .json({ message: AuthErrorMsg.INVALID_ACCESS_TOKEN });
      return;
    }

    // Select repository based on role
    let user;
    if (req.user.role === Roles.STUDENT) {
      const studentRepo = new StudentRepository();
      user = await studentRepo.findById(req.user.id);
    } else if (req.user.role === Roles.INSTRUCTOR) {
      const instructorRepo = new InstructorRepository();
      user = await instructorRepo.findById(req.user.id);
    } else if (req.user.role === Roles.ADMIN) {
      // Admins may not have block checks, or handle differently
      return next();
    } else {
      res
        .status(StatusCode.UNAUTHORIZED)
        .json({ message: AuthErrorMsg.INVALID_ROLE });
      return;
    }

    // Check if user exists
    if (!user) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res
        .status(StatusCode.UNAUTHORIZED)
        .json({ message: AuthErrorMsg.USER_NOT_FOUND });
      return;
    }

    // Check if user is blocked
    if (user.isBlocked) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res
        .status(StatusCode.FORBIDDEN)
        .json({ message: AuthErrorMsg.ACCOUNT_BLOCKED });
      return;
    }
    next();
  } catch (error) {
    appLogger.error("Restrict Blocked User Error:", error);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      message: AuthErrorMsg.INTERNAL_SERVER_ERROR,
      error: error instanceof Error && error.message,
    });
  }
};
