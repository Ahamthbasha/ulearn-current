import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "../utils/jwt";
import { AuthErrorMsg } from "../utils/constants";
import { StatusCode } from "../utils/enums";
import dotenv from "dotenv";
import { appLogger } from "../utils/logger";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
  };
}

const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const accessToken = req.cookies["accessToken"];
  const refreshToken = req.cookies["refreshToken"];

  if (!accessToken) {
    appLogger.info("❌ No accessToken found in cookies");
    res
      .status(StatusCode.UNAUTHORIZED)
      .json({ failToken: true, message: AuthErrorMsg.NO_ACCESS_TOKEN });
    return;
  }

  try {
    // Verify Access Token
    const accessPayload = jwt.verify(
      accessToken,
      JWT_SECRET,
    ) as AuthenticatedRequest["user"];

    req.user = accessPayload;
    next();
    return;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      if (!refreshToken) {
        res
          .status(StatusCode.UNAUTHORIZED)
          .json({ failToken: true, message: AuthErrorMsg.NO_REFRESH_TOKEN });
        return;
      }

      try {
        // Verify Refresh Token
        const refreshPayload = jwt.verify(
          refreshToken,
          JWT_SECRET,
        ) as AuthenticatedRequest["user"];

        if (!refreshPayload) {
          res
            .status(StatusCode.UNAUTHORIZED)
            .json({ message: AuthErrorMsg.INVALID_REFRESH_TOKEN });
          return;
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (refreshPayload.exp && refreshPayload.exp < currentTime) {
          res
            .status(StatusCode.UNAUTHORIZED)
            .json({ message: AuthErrorMsg.REFRESH_TOKEN_EXPIRED });
          return;
        }

        // Generate a new Access Token
        const jwtService = new JwtService();
        const newAccessToken = await jwtService.accessToken({
          id: refreshPayload.id,
          email: refreshPayload.email,
          role: refreshPayload.role,
        });

        appLogger.info("new Access Token", newAccessToken);

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          // optionally add secure: true in production
        });

        req.cookies["accessToken"] = newAccessToken;
        req.user = refreshPayload;

        next();
        return;
      } catch (refreshErr) {
        if (refreshErr instanceof jwt.TokenExpiredError) {
          res
            .status(StatusCode.UNAUTHORIZED)
            .json({ message: AuthErrorMsg.REFRESH_TOKEN_EXPIRED });
          return;
        }

        res
          .status(StatusCode.UNAUTHORIZED)
          .json({ message: AuthErrorMsg.INVALID_ACCESS_TOKEN });
        return;
      }
    }

    res
      .status(StatusCode.BAD_REQUEST)
      .json({ message: AuthErrorMsg.INVALID_ACCESS_TOKEN });
    return;
  }
};

export default authenticateToken;