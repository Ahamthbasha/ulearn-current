import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import dotenv from "dotenv";
import { appLogger } from "../utils/logger";
import { AuthenticatedRequest } from "./authenticatedRoutes";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const optionalAuthenticateToken = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const accessToken = req.cookies["accessToken"];

  if (!accessToken) {
    appLogger.info("No token found — proceeding as guest");
    return next();
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as AuthenticatedRequest["user"];
    req.user = decoded;
    next();
  } catch (err) {
    appLogger.info("Invalid token — proceeding as guest");
    next();
  }
};
