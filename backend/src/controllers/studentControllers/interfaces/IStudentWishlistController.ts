import { Request, Response } from "express";

export interface IStudentWishlistController {
  addToWishlist(req: Request, res: Response): Promise<void>;
  removeFromWishlist(req: Request, res: Response): Promise<void>;
  getWishlistCourses(req: Request, res: Response): Promise<void>;
  isCourseInWishlist(req: Request, res: Response): Promise<void>;
}
