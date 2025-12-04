import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * General API rate limiting middleware
 */
export const generalRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes by default
  max: config.RATE_LIMIT_MAX_REQUESTS, // 100 requests per window by default
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`🚨 Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Stricter rate limiting for transcription endpoints
 */
export const transcriptionRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 transcription requests per 10 minutes
  message: {
    error: 'Too Many Requests',
    message: 'Too many transcription requests. Please wait before creating more transcriptions.',
    retryAfter: 600 // 10 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚨 Transcription rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many transcription requests. Please wait before creating more transcriptions.',
      retryAfter: 600,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Azure endpoint specific rate limiting
 */
export const azureRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 Azure requests per 15 minutes
  message: {
    error: 'Too Many Requests',
    message: 'Too many Azure transcription requests. Please wait before trying again.',
    retryAfter: 900 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚨 Azure rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many Azure transcription requests. Please wait before trying again.',
      retryAfter: 900,
      timestamp: new Date().toISOString()
    });
  }
});
