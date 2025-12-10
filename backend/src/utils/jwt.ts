import jwt, { JwtPayload } from "jsonwebtoken";
import { EnvErrorMsg, JwtErrorMsg } from "./constants";
import dotenv from "dotenv";

dotenv.config();

export class JwtService {
  async createToken(payload: Record<string, unknown>): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(EnvErrorMsg.JWT_NOT_FOUND);
    }
    const token = jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_EXPIRATION,
    });
    return token;
  }

  async accessToken(payload: Record<string, unknown>): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(EnvErrorMsg.JWT_NOT_FOUND);
    }
    return jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_EXPIRATION,
    });
  }

  async refreshToken(payload: Record<string, unknown>): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(EnvErrorMsg.JWT_NOT_FOUND);
    }
    const token = jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_REFRESH_EXPIRATION,
    });
    return token;
  }

  async verifyToken(token: string): Promise<JwtPayload | string> {
    try {
      const secret = process.env.JWT_SECRET || "MYLIFEMYRULE";
      const data = jwt.verify(token, secret);
      return data;
    } catch (error) {
      throw error;
    }
  }
}
