import { appLogger } from "../utils/logger";
import redisClient from "../config/redis";
import IOtpServices from "./interface/IOtpService";

export class RedisOtpService implements IOtpServices {
  private readonly OTP_PREFIX = "otp:";
  private readonly DEFAULT_EXPIRATION = 1;

  private getOtpKey(email: string): string {
    return `${this.OTP_PREFIX}${email.toLowerCase()}`;
  }

  async createOtp(
    email: string,
    otp: string,
    expirationSeconds: number = this.DEFAULT_EXPIRATION * 60,
  ): Promise<boolean> {
    try {
      const key = this.getOtpKey(email);
      await redisClient.setex(key, expirationSeconds, otp);
      appLogger.info(
        `OTP created for ${email}: ${otp} (expires in ${expirationSeconds} seconds)`,
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  async findOtp(email: string): Promise<string | null> {
    try {
      const key = this.getOtpKey(email);
      const otp = await redisClient.get(key);
      return otp;
    } catch (error) {
      throw error;
    }
  }

  async deleteOtp(email: string): Promise<boolean> {
    try {
      const key = this.getOtpKey(email);
      const result = await redisClient.del(key);
      return result > 0;
    } catch (error) {
      throw error;
    }
  }

  async verifyOtp(email: string, providedOtp: string): Promise<boolean> {
    try {
      const storedOtp = await this.findOtp(email);

      if (!storedOtp) {
        appLogger.info(`OTP not found or expired for email: ${email}`);
        return false;
      }

      const isValid = storedOtp === providedOtp;

      if (isValid) {
        await this.deleteOtp(email);
        appLogger.info(`OTP verified and deleted for email: ${email}`);
      } else {
        appLogger.info(`Invalid OTP provided for email: ${email}`);
      }

      return isValid;
    } catch (error) {
      throw error;
    }
  }

  async getOtpTTL(email: string): Promise<number> {
    try {
      const key = this.getOtpKey(email);
      const ttl = await redisClient.ttl(key);
      return ttl;
    } catch (error) {
      throw error;
    }
  }

  async otpExists(email: string): Promise<boolean> {
    try {
      const key = this.getOtpKey(email);
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      throw error;
    }
  }

  async getOtpRemainingTime(email: string): Promise<string | null> {
    try {
      const ttl = await this.getOtpTTL(email);

      if (ttl === -2) return null; // Key doesn't exist
      if (ttl === -1) return null; // No expiration set

      return ttl.toString(); // Return remaining seconds
    } catch (error) {
      throw error;
    }
  }
}

export default RedisOtpService;
