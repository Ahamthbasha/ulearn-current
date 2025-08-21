import { Response, NextFunction } from "express";
import InstructorRepository from "../repositories/instructorRepository/instructorRepository";
import { AuthenticatedRequest } from "./authenticatedRoutes";

const instructorRepo = new InstructorRepository();

export const mentorCheck = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const instructorId = req.user?.id;

    if (!instructorId) {
      res.status(401).json({ message: "Unauthorized: Instructor ID missing." });
      return;
    }

    const instructor = await instructorRepo.findById(instructorId);

    if (!instructor || !instructor.isMentor) {
      res.status(403).json({
        message: "Access denied. You must be a mentor to use this functionality.",
      });
      return;
    }

    next(); // only reached if all checks passed
  } catch (error) {
    console.error("Mentor check failed:", error);
    res.status(500).json({ message: "Internal server error." });
    return;
  }
};
