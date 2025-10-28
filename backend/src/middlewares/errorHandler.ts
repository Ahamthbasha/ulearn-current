// middlewares/errorHandler.ts

import { Request, Response, NextFunction } from "express";
import { appLogger } from "../utils/logger";
import { isAppError, isError } from "../utils/error";
import { StatusCode } from "../utils/enums";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = StatusCode.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let isOperational = false;

  // Handle AppError instances
  if (isAppError(err)) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } 
  // Handle standard Error instances
  else if (isError(err)) {
    message = err.message;
  }
  // Handle unknown error types
  else if (typeof err === "string") {
    message = err;
  }

  // Log error details
  appLogger.error("API error", {
    statusCode,
    message,
    isOperational,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: isError(err) ? err.stack : undefined,
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
  });
};