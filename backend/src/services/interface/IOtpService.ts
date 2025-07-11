import  {IOtp}  from "../../models/otpModel";

export default interface IOtpServices{
    findOtp(email:string):Promise<IOtp | null>
    deleteOtp(email:string):Promise<IOtp | null>
    createOtp(email:string,otp:string):Promise<IOtp | null>
}