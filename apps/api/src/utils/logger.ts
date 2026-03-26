import { env } from '../config/env.js';

/** Log level severity order */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Numeric severity for filtering */
const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** ANSI color codes for pretty-printing in development */
const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

/** Minimum log level based on environment */
const MIN_LEVEL: LogLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * Formats a log entry for output.
 * In development, pretty-prints with colors.
 * In production, outputs single-line JSON.
 */
function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const entry = {
    level,
    message,
    timestamp,
    service: 'dsa-tracker-api',
    ...meta,
  };

  if (env.NODE_ENV === 'development') {
    const color = COLORS[level];
    const levelTag = `${color}[${level.toUpperCase()}]${RESET}`;
    const time = `\x1b[90m${timestamp}${RESET}`;
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${time} ${levelTag} ${message}${metaStr}`;
  }

  return JSON.stringify(entry);
}

/**
 * Writes a log entry to stdout/stderr if it meets the minimum severity.
 */
function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL_SEVERITY[level] < LEVEL_SEVERITY[MIN_LEVEL]) {
    return;
  }

  const formatted = formatEntry(level, message, meta);

  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(formatted);
  } else if (level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(formatted);
  } else {
    // eslint-disable-next-line no-console
    console.log(formatted);
  }
}

/**
 * Structured JSON logger with colored pretty-printing in development.
 *
 * @example
 * ```ts
 * logger.info('Server started', { port: 5000 });
 * logger.error('Database connection failed', { error: err.message });
 * ```
 */
export const logger = {
  /** Log debug-level message (suppressed in production) */
  debug(message: string, meta?: Record<string, unknown>): void {
    log('debug', message, meta);
  },

  /** Log info-level message */
  info(message: string, meta?: Record<string, unknown>): void {
    log('info', message, meta);
  },

  /** Log warning-level message */
  warn(message: string, meta?: Record<string, unknown>): void {
    log('warn', message, meta);
  },

  /** Log error-level message */
  error(message: string, meta?: Record<string, unknown>): void {
    log('error', message, meta);
  },
};
