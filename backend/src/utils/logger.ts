import fs from "fs";
import path from "path";
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { createStream } from "rotating-file-stream";

const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

export const appLogger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [
    new transports.Console({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      format:
        process.env.NODE_ENV === "production"
          ? format.combine(format.timestamp(), format.simple())
          : format.combine(format.colorize(), format.simple()),
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
      maxSize: "20m",
      zippedArchive: true,
    }),
    new DailyRotateFile({
      dirname: logsDir,
      filename: "error-%DATE%.log",
      level: "error",
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
      maxSize: "20m",
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});
export const accessLogStream = createStream("access.log", {
  interval: "1d",
  path: logsDir,
  size: "20M",
  maxFiles: 30,
  compress: "gzip",
});
