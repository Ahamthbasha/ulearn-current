import { Response } from "express";
import { StatusCode } from "./enums";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  isAppError,
  isError,
} from "./error";
import { appLogger } from "./logger";

export const throwAppError = (
  Ctor:
    | typeof BadRequestError
    | typeof UnauthorizedError
    | typeof ForbiddenError
    | typeof NotFoundError
    | typeof ConflictError
    | typeof ValidationError
    | typeof InternalServerError,
  message?: string
): never => {
  throw new Ctor(message ?? "");
};

export const handleControllerError = (error: unknown, res: Response): void => {
  
  if (error instanceof BadRequestError) {
    res.status(StatusCode.BAD_REQUEST).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof UnauthorizedError) {
    res.status(StatusCode.UNAUTHORIZED).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof ForbiddenError) {
    res.status(StatusCode.FORBIDDEN).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(StatusCode.NOT_FOUND).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof ConflictError) {
    res.status(StatusCode.CONFLICT).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(StatusCode.UNPROCESSABLE_ENTITY).json({ success: false, message: error.message });
    return;
  }
  if (error instanceof InternalServerError) {
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  if (isError(error)) {
    appLogger.error("Unhandled error:", { message: error.message, stack: error.stack });
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "An unexpected error occurred",
    });
    return;
  }

  appLogger.error("Unknown error type:", { error });
  res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "An unexpected error occurred",
  });
};

export {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
};