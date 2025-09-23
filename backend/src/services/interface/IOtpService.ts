export default interface IOtpServices {
  createOtp(email: string, otp: string, expirationSeconds?: number): Promise<boolean>;
  findOtp(email: string): Promise<string | null>;
  deleteOtp(email: string): Promise<boolean>;
  verifyOtp(email: string, otp: string): Promise<boolean>;
  otpExists(email: string): Promise<boolean>;
  getOtpRemainingTime(email: string): Promise<string | null>;
}