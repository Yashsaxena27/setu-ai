import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitStore>();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  code?: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client IP
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
    const key = `${req.baseUrl || ""}:${clientIp}`;
    const now = Date.now();

    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      memoryStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    record.count += 1;

    if (record.count > options.max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: options.message || "Too many requests, please slow down.",
        error: {
          code: options.code || "RATE_LIMIT_EXCEEDED",
          message: options.message || "Too many requests, please slow down.",
        },
      });
    }

    next();
  };
}

// Clean up stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests from this IP. Please try again in 15 minutes.",
  code: "GENERAL_RATE_LIMIT_EXCEEDED",
});

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "AI processing limit reached. Please wait a minute before making another query.",
  code: "AI_RATE_LIMIT_EXCEEDED",
});
