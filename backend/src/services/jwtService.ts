import jwt from "jsonwebtoken";
import { EnvErrorMsg, JwtErrorMsg } from "../utils/constants";
import { IJwtService } from "./interface/IJwtService";
import dotenv from "dotenv";

dotenv.config();

export class JwtService implements IJwtService {
  async createToken(payload: Object): Promise<string> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(EnvErrorMsg.JWT_NOT_FOUND);
    }

    const verifyToken = await jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_EXPIRATION,
    });

    return verifyToken;
  }

  //authenticate
  async accessToken(payload: Object): Promise<string> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(EnvErrorMsg.JWT_NOT_FOUND);
    }

    return jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_EXPIRATION,
    });
  }

  //to get accessToken
  async refreshToken(payload: Object): Promise<string> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(EnvErrorMsg.JWT_NOT_FOUND);
    }

    const verifyToken = await jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_REFRESH_EXPIRATION,
    });

    return verifyToken;
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const secret = process.env.JWT_SECRET || "MYLIFEMYRULE";

      const data = await jwt.verify(token, secret);

      return data;
    } catch (error) {
      throw error;
    }
  }
}
