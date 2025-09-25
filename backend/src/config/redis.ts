// import Redis from "ioredis";

// const redisClient = new Redis({
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: Number(process.env.REDIS_PORT) || 6379,
// });

// redisClient.on("connect", () => {
//   console.log("Connected to Redis");
// });

// export default redisClient;

import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

export default redisClient;
