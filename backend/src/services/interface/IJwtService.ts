import  { JwtPayload } from "jsonwebtoken";

export interface IJwtService {
  createToken(payload: Record<string, unknown>): Promise<string>;
  accessToken(payload: Record<string, unknown>): Promise<string>;
  refreshToken(payload: Record<string, unknown>): Promise<string>;
  verifyToken(token: string): Promise<JwtPayload | string>;
}
