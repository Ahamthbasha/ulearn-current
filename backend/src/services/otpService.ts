import redisClient from "../config/redis";
import IOtpServices from "./interface/IOtpService";

export class RedisOtpService implements IOtpServices {
  private readonly OTP_PREFIX = "otp:";
  private readonly DEFAULT_EXPIRATION = 1; // minutes (60 seconds)

  private getOtpKey(email: string): string {
    return `${this.OTP_PREFIX}${email.toLowerCase()}`;
  }

  async createOtp(email: string, otp: string, expirationSeconds: number = this.DEFAULT_EXPIRATION * 60): Promise<boolean> {
    try {
      const key = this.getOtpKey(email);
      await redisClient.setex(key, expirationSeconds, otp);
      console.log(`OTP created for ${email}: ${otp} (expires in ${expirationSeconds} seconds)`);
      return true;
    } catch (error) {
      console.error("Error creating OTP:", error);
      throw error;
    }
  }

  async findOtp(email: string): Promise<string | null> {
    try {
      const key = this.getOtpKey(email);
      const otp = await redisClient.get(key);
      return otp;
    } catch (error) {
      console.error("Error finding OTP:", error);
      throw error;
    }
  }

  async deleteOtp(email: string): Promise<boolean> {
    try {
      const key = this.getOtpKey(email);
      const result = await redisClient.del(key);
      return result > 0;
    } catch (error) {
      console.error("Error deleting OTP:", error);
      throw error;
    }
  }

  async verifyOtp(email: string, providedOtp: string): Promise<boolean> {
    try {
      const storedOtp = await this.findOtp(email);

      if (!storedOtp) {
        console.log(`OTP not found or expired for email: ${email}`);
        return false;
      }

      const isValid = storedOtp === providedOtp;

      if (isValid) {
        await this.deleteOtp(email);
        console.log(`OTP verified and deleted for email: ${email}`);
      } else {
        console.log(`Invalid OTP provided for email: ${email}`);
      }

      return isValid;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  }

  async getOtpTTL(email: string): Promise<number> {
    try {
      const key = this.getOtpKey(email);
      const ttl = await redisClient.ttl(key);
      return ttl; // Returns seconds until expiration, -1 if no expiration, -2 if key doesn't exist
    } catch (error) {
      console.error("Error getting OTP TTL:", error);
      throw error;
    }
  }

  async otpExists(email: string): Promise<boolean> {
    try {
      const key = this.getOtpKey(email);
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Error checking OTP existence:", error);
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
      console.error("Error getting OTP remaining time:", error);
      throw error;
    }
  }
}

export default RedisOtpService;