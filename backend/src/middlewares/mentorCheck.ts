import { Response, NextFunction } from "express";
import InstructorRepository from "../repositories/instructorRepository/instructorRepository";
import { AuthenticatedRequest } from "./authenticatedRoutes";
import { StatusCode } from "../utils/enums";
import { InstructorErrorMessages } from "../utils/constants";

const instructorRepo = new InstructorRepository();

export const mentorCheck = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const instructorId = req.user?.id;

    if (!instructorId) {
      res.status(StatusCode.UNAUTHORIZED).json({
        message: InstructorErrorMessages.INSTRUCTOR_ID_MISSING_UNAUTHORIZED,
      });
      return;
    }

    const instructor = await instructorRepo.findById(instructorId);

    if (!instructor || !instructor.isMentor) {
      res.status(StatusCode.FORBIDDEN).json({
        message: InstructorErrorMessages.ACCESS_DENIED,
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Mentor check failed:", error);
    res
      .status(StatusCode.INTERNAL_SERVER_ERROR)
      .json({ message: InstructorErrorMessages.INTERNAL_SERVER_ERROR });
    return;
  }
};
