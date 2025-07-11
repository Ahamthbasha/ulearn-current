import otpModel, { IOtp } from "../models/otpModel";
import { GenericRepository } from "./genericRepository";

import IOtpRepository from "./interfaces/IOtpRepository";

export class OtpRepository extends GenericRepository<IOtp> implements IOtpRepository{
    constructor(){
        super(otpModel)
    }

    async createOtp(email:string,otp:string):Promise<IOtp | null>{
        try {
            const response = await this.updateOne({email},{otp})
            if(!response){
                return await this.create({email,otp})
            }
            return response
        } catch (error) {
            throw error
        }
    }

    async findOtp(email:string):Promise<IOtp | null>{
        try {
            const response = await this.findOne({email})
            return response
        } catch (error) {
            throw error
        }
    }

    async deleteOtp(email: string): Promise<IOtp | null> {
        try {
            const otpData = await this.findOne({email})
            if(!otpData){
                throw new Error('hello')
            }
            const otpId = otpData._id as string
            const response = await this.delete(otpId)
            return response
        } catch (error) {
            throw error
        }
    }
}