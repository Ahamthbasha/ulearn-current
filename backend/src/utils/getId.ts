import jwt from "jsonwebtoken";
import { Request } from "express";
import { AuthErrorMsg } from "./constants";

export interface CustomRequest extends Request {
  user?: {
    user: string;
    role: string;
    iat: number;
    exp: number;
  };
}

const getId = ( req: CustomRequest): string | null => {
  try {
    const accessToken = req.cookies["accessToken"];
    const decodedData: any = jwt.decode(accessToken);
    const { id } = decodedData;
    console.log(id,"decoded id")
    return id;
  } catch (error) {
    console.error(AuthErrorMsg.TOKEN_VERIFICATION_ERROR, error);
    return null;
  }
};

export default getId;