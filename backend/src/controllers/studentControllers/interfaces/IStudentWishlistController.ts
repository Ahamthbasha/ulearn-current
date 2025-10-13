import { Response } from "express";
import { AuthenticatedRequest } from "../../../middlewares/authenticatedRoutes";

export interface IStudentWishlistController {
  addToWishlist(req: AuthenticatedRequest, res: Response): Promise<void>;
  removeFromWishlist(req: AuthenticatedRequest, res: Response): Promise<void>;
  getWishlistItems(req: AuthenticatedRequest, res: Response): Promise<void>;
  isItemInWishlist(req: AuthenticatedRequest, res: Response): Promise<void>;
}