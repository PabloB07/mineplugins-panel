import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Environment variables for API authentication
const PLUGIN_API_KEY = process.env.PLUGIN_API_KEY || "";
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Validates the API key from the request headers
 */
export function validateApiKey(request: NextRequest): boolean {
  if (!PLUGIN_API_KEY) {
    return false;
  }

  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return false;
  }

  // Compare using timing-safe comparison to prevent timing attacks
  const expectedKey = Buffer.from(PLUGIN_API_KEY);
  const receivedKey = Buffer.from(apiKey);

  if (expectedKey.length !== receivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedKey, receivedKey);
}

/**
 * Rate limiting middleware
 * Returns null if allowed, or a NextResponse if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): NextResponse | null {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return null;
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return NextResponse.json(
      {
        valid: false,
        error: "RATE_LIMITED",
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(record.resetTime / 1000)),
        },
      }
    );
  }

  record.count++;
  return null;
}

/**
 * Gets the client IP from the request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Validates a request signature (for webhook callbacks)
 */
export function validateRequestSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Creates standard error response
 */
export function errorResponse(
  error: string,
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    {
      valid: false,
      error,
      message,
    },
    { status }
  );
}

/**
 * Middleware wrapper for plugin API endpoints
 * Validates API key and applies rate limiting
 */
export function withPluginAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const clientIp = getClientIp(request);

    // Apply rate limiting first
    const rateLimitResponse = checkRateLimit(clientIp);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate API key
    if (!validateApiKey(request)) {
      return errorResponse(
        "UNAUTHORIZED",
        "Invalid or missing API key",
        401
      );
    }

    // Call the actual handler
    return handler(request);
  };
}

/**
 * Clean up expired rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
