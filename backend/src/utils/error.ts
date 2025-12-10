export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal Server Error") {
    super(500, message);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Type guard to check if error is AppError
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

// Type guard to check if error is standard Error
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};


export interface ConflictErrorWithOrderId extends ConflictError {
  orderId: string;
}


export const isConflictErrorWithOrderId = (
  error: unknown
): error is ConflictErrorWithOrderId => {
  return (
    error instanceof ConflictError &&
    typeof (error as ConflictErrorWithOrderId).orderId === 'string'
  );
};


export class PaymentInProgressError extends AppError {
  constructor(message: string = "Payment is already in progress. Please complete it in the other tab.") {
    super(409, message); // 409 Conflict
    Object.setPrototypeOf(this, PaymentInProgressError.prototype);
  }
}