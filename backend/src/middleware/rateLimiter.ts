import rateLimit from 'express-rate-limit';
import { getConfig } from '../config/env';

/**
 * Rate limiter middleware.
 * Configurable via RATE_LIMIT_RPM environment variable.
 */
export function createRateLimiter() {
  const config = getConfig();

  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: config.RATE_LIMIT_RPM,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds: 60,
    },
    keyGenerator: (req) => {
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
  });
}
