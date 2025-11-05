import { Request, Response, NextFunction } from "express";

export interface IInstructorModuleController {
  createModule(req: Request, res: Response, next: NextFunction): Promise<void>;
  getModulesByCourse(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  updateModule(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteModule(req: Request, res: Response, next: NextFunction): Promise<void>;
  getModuleById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  reorderModules(req: Request, res: Response, next: NextFunction): Promise<void>;
}