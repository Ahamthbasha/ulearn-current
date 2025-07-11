import { Roles,StatusCode } from "../utils/enums";
import { JwtService } from "../utils/jwt";
import { Request,Response,NextFunction } from "express";
import { AuthErrorMsg } from "../utils/constants";

export const isStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const Token = req.cookies.accessToken;

    if (!Token) {
      res.status(StatusCode.UNAUTHORIZED).send(AuthErrorMsg.ACCESS_FORBIDDEN);
      return;
    }

    const JWT = new JwtService();
    const decode = await JWT.verifyToken(Token);

    if (decode?.role !== Roles.STUDENT) {
      res.status(StatusCode.UNAUTHORIZED).send(AuthErrorMsg.ACCESS_FORBIDDEN);
      return;
    }
    next();
  } catch (error) {
    res.status(StatusCode.UNAUTHORIZED).send(AuthErrorMsg.INVALID_ACCESS_TOKEN);
  }
};

export const isInstructor = async(req:Request,res:Response,next:NextFunction):Promise<void> => {
    try {
        const Token = req.cookies.accessToken
        if(!Token){
            res.status(StatusCode.UNAUTHORIZED).send(AuthErrorMsg.ACCESS_FORBIDDEN)
            return
        }

        const JWT = new JwtService()
        const decode = await JWT.verifyToken(Token)

        if(decode){
            if(decode.role != Roles.INSTRUCTOR){
                res.status(StatusCode.UNAUTHORIZED).send(AuthErrorMsg.ACCESS_FORBIDDEN)
                return
            }
        }
        
        next()
    } catch (error) {
        throw error
    }
}

export const isAdmin = async(req:Request,res:Response,next:NextFunction):Promise<void> => {
    try {
        const Token = req.cookies.accessToken

        if(!Token){
            res.status(StatusCode.UNAUTHORIZED).send(AuthErrorMsg.ACCESS_FORBIDDEN)
            return
        }

        const JWT = new JwtService()
        const decode = await JWT.verifyToken(Token)

        if(decode){
            if(decode.role != Roles.ADMIN){
                res.status(StatusCode.UNAUTHORIZED).send(AuthErrorMsg.ACCESS_FORBIDDEN)
                return
            }
        }
        next()
    } catch (error) {
        throw error
    }
}