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

const getId = (req: CustomRequest): string | null => {
  try {
    const accessToken = req.cookies["accessToken"];
    const decodedData: any = jwt.decode(accessToken);
    const { id } = decodedData;
    return id;
  } catch (error) {
    appLogger.error(AuthErrorMsg.TOKEN_VERIFICATION_ERROR, error);
    return null;
  }
};

export default getId;
