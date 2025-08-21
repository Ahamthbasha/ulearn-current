import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authenticatedRoutes";

export interface IStudentCartController {
  getCart(req: AuthenticatedRequest, res: Response): Promise<void>;
  addToCart(req: AuthenticatedRequest, res: Response): Promise<void>;
  removeFromCart(req: AuthenticatedRequest, res: Response): Promise<void>;
  clearCart(req: AuthenticatedRequest, res: Response): Promise<void>;
}
