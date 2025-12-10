import Redis from "ioredis";
import { appLogger } from "../utils/logger";

const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      tls: process.env.REDIS_URL.startsWith("rediss://")
        ? { rejectUnauthorized: false }
        : undefined,
      maxRetriesPerRequest: 3,
    })
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    });

redisClient.on("connect", () => {
  appLogger.info("✅ Connected to Redis");
});

redisClient.on("error", (err) => {
  appLogger.error("Redis Client Error:", err);
});

export default redisClient;
