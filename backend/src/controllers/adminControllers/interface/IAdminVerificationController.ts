import { Request,Response } from "express";

export default interface IAdminVerificationController{
getAllRequests(req: Request, res: Response): Promise<void>;
getRequestData(req: Request, res: Response): Promise<void>;
approveRequest(req: Request, res: Response): Promise<void>;
}