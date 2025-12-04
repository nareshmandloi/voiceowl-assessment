import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export class ErrorHandler {
  /**
   * Global error handling middleware
   */
  public static handle = (
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    console.error('🔥 Error caught by global handler:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });

    // Default error response
    let status = error.status || 500;
    let message = error.message || 'Internal Server Error';

    // Handle specific error types
    if (error.name === 'ValidationError') {
      status = 400;
      message = 'Validation Error: ' + error.message;
    } else if (error.name === 'CastError') {
      status = 400;
      message = 'Invalid ID format';
    } else if (error.name === 'MongoServerError' && error.code === 'E11000') {
      status = 409;
      message = 'Duplicate entry';
    } else if (error.name === 'JsonWebTokenError') {
      status = 401;
      message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      status = 401;
      message = 'Token expired';
    }

    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && status === 500) {
      message = 'Internal Server Error';
    }

    res.status(status).json({
      error: ErrorHandler.getErrorName(status),
      message,
      timestamp: new Date().toISOString(),
      path: req.url
    });
  };

  /**
   * Handle 404 errors for undefined routes
   */
  public static notFound = (req: Request, res: Response): void => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.url} not found`,
      timestamp: new Date().toISOString(),
      path: req.url
    });
  };

  /**
   * Async error wrapper for route handlers
   */
  public static asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Get standardized error name from status code
   */
  private static getErrorName(status: number): string {
    const errorNames: { [key: number]: string } = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };

    return errorNames[status] || 'Error';
  }
}
