

export interface IJwtService {
  createToken(payload: Object): Promise<string>;
  accessToken(payload: Object): Promise<string>;
  refreshToken(payload: Object): Promise<string>;
  verifyToken(token: string): Promise<any>;
}