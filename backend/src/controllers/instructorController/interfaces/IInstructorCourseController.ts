import { Request, Response, NextFunction } from "express";

export interface IInstructorCourseController {
  createCourse(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateCourse(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void>;
  getCourseById(req: Request, res: Response, next: NextFunction): Promise<void>;

  getInstructorCourses(req:Request,res:Response,next:NextFunction):Promise<void>

  publishCourse(req: Request, res: Response, next: NextFunction): Promise<void>;

}
