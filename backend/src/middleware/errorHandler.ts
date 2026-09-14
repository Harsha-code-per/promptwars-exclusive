import { Request, Response, NextFunction } from 'express';
import { truncateForLog } from '../utils';

/**
 * Global error handler.
 * Never logs full contract contents. Strips sensitive details from error responses.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with truncated message — never log full document contents
  console.error('[error]', truncateForLog(err.message, 200));

  // Determine status code
  const statusCode = getStatusCode(err);

  res.status(statusCode).json({
    error: {
      message: getClientMessage(err, statusCode),
      code: statusCode,
    },
  });
}

function getStatusCode(err: Error): number {
  if (err.message.includes('not found') || err.message.includes('Not found')) return 404;
  if (err.message.includes('Unsupported file type')) return 400;
  if (err.message.includes('too short')) return 400;
  if (err.message.includes('validation')) return 400;
  if (err.message.includes('rate limit') || err.message.includes('Too many')) return 429;
  return 500;
}

function getClientMessage(err: Error, statusCode: number): string {
  // For 5xx errors, don't expose internal details
  if (statusCode >= 500) {
    return 'An internal error occurred. Please try again later.';
  }
  return err.message;
}
