import { IOtpGenerate } from "../types/types";

export class OtpGenerate implements IOtpGenerate {
  async createOtpDigit(length: number = 4): Promise<string> {
    try {
      const digits = "0123456789";
      let OTP = "";

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        OTP += digits[randomIndex];
      }

      console.log(`OTP: ==> ${OTP}`);
      return OTP;
    } catch (error) {
      throw error;
    }
  }
}
