import mongoose, { Model,Document, Schema } from "mongoose";

export interface IOtp extends Document{
    email:string,
    otp:string,
    createdAt:Date,
    expiresAt:Date
}

const otpSchema = new Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 1000),
    index: { expires: '1h' }
}
})

const otpModel :Model<IOtp> = mongoose.model<IOtp>("otp",otpSchema)
export default otpModel