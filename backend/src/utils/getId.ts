import jwt from "jsonwebtoken";
import { Request } from "express";
import { AuthErrorMsg } from "./constants";
import { appLogger } from "./logger";

export interface CustomRequest extends Request {
  user?: {
    user: string;
    role: string;
    iat: number;
    exp: number;
  };
}

interface TokenPayload {
  id?: string;
  [key: string]: unknown;
}

const getId = (req: CustomRequest): string | null => {
  try {
    const accessToken = req.cookies["accessToken"];
    if (!accessToken) return null;

    const decodedData = jwt.decode(accessToken);

    if (
      decodedData &&
      typeof decodedData === "object" &&
      !Array.isArray(decodedData) &&
      "id" in decodedData &&
      typeof (decodedData as TokenPayload).id === "string"
    ) {
      return (decodedData as TokenPayload).id!;
    }

    return null;
  } catch (error) {
    appLogger.error(AuthErrorMsg.TOKEN_VERIFICATION_ERROR, error);
    return null;
  }
};

export default getId;
