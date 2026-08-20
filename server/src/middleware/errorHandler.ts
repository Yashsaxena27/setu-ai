import { Request, Response, NextFunction } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode = 500, errorCode = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.errorCode || (statusCode === 404 ? "NOT_FOUND" : statusCode === 401 ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR");
  const message = err.message || "An unexpected internal server error occurred";

  // Server-side logging without leaking secrets
  console.error(`[ERROR] [${req.method}] ${req.originalUrl} | Code: ${errorCode} | Status: ${statusCode} | Msg: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode,
      message,
      ...(process.env.NODE_ENV === "development" && err.stack ? { stack: err.stack } : {}),
    },
  });
}
