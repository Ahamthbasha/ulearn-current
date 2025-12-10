import Redis from "ioredis";
import { appLogger } from "../utils/logger";

const redisClient = process.env.REDIS_URL
<<<<<<< HEAD
  ? new Redis(process.env.REDIS_URL, {
      tls: process.env.REDIS_URL.startsWith("rediss://")
        ? { rejectUnauthorized: false }
        : undefined,
      maxRetriesPerRequest: 3,
    })
=======
  ? new Redis(process.env.REDIS_URL)
>>>>>>> ec3e6c08317125de2f01dd2619ec77d688dc78cc
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    });

redisClient.on("connect", () => {
<<<<<<< HEAD
  appLogger.info("✅ Connected to Redis");
=======
  appLogger.info("Connected to Redis");
>>>>>>> ec3e6c08317125de2f01dd2619ec77d688dc78cc
});

redisClient.on("error", (err) => {
  appLogger.error("Redis Client Error:", err);
});

export default redisClient;
