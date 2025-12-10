import jwt, { JwtPayload } from "jsonwebtoken";
import { IJwtService } from "./interface/IJwtService";
import { EnvErrorMsg, JwtErrorMsg } from "../utils/constants";

export class JwtService implements IJwtService {
  async createToken(payload: Record<string, unknown>): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error(EnvErrorMsg.JWT_NOT_FOUND);

    const token = jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_EXPIRATION,
    });
    return token;
  }

  async accessToken(payload: Record<string, unknown>): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error(EnvErrorMsg.JWT_NOT_FOUND);

    return jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_EXPIRATION,
    });
  }

  async refreshToken(payload: Record<string, unknown>): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error(EnvErrorMsg.JWT_NOT_FOUND);

    const token = jwt.sign(payload, secret, {
      expiresIn: JwtErrorMsg.JWT_REFRESH_EXPIRATION,
    });
    return token;
  }

  async verifyToken(token: string): Promise<JwtPayload | string> {
    try {
      const secret = process.env.JWT_SECRET || "MYLIFEMYRULE";
      const decoded = jwt.verify(token, secret);
      if(typeof decoded === "string"){
        return decoded
      }else{
        return decoded;
      }
    } catch (error) {
      throw error;
    }
  }
}
