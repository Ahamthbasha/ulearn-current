import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { createStream } from 'rotating-file-stream';

// Always write logs to project-root/logs
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Winston application logger (for app events & errors)
export const appLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Console (pretty) in non-production; cleaner in prod
    new transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: process.env.NODE_ENV === 'production'
        ? format.combine(format.timestamp(), format.simple())
        : format.combine(format.colorize(), format.simple()),
    }),
    // App logs (info+)
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    }),
    // Error-only logs
    new DailyRotateFile({
      dirname: logsDir,
      filename: 'error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});

// Morgan access log stream (rotates daily)
export const accessLogStream = createStream('access.log', {
  interval: '1d',          // rotate daily
  path: logsDir,
  size: '20M',             // also rotate if >20MB within a day
  maxFiles: 30,            // keep last 30 files
  compress: 'gzip',        // gzip rotated files
});
