import mongoose, {Schema, Document, ObjectId } from "mongoose";

export interface IUserDTO{
    username:string,
    email:string,
    password:string,
    role?:string
}
export interface IUser extends Document{
    _id:ObjectId,
    username:string,
    email:string,
    password:string,
    role?:string,
    profilePicUrl?:string,
    studiedHours:number,
    isVerified:boolean,
    isBlocked:boolean,
    skills?:string[],
    expertise?:string[],
    currentStatus?:string,
    lastLogin?:Date,
    createdAt?:Date,
    updatedAt?:Date
}

const userSchema:Schema<IUser> = new Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:false
    },
    profilePicUrl:{
        type:String,
        required:false
    },
    studiedHours:{
        type:Number,
        required:false,
        default:0
    },
    isVerified:{
        type:Boolean,
        required:false,
        default:false
    },
    isBlocked:{
        type:Boolean,
        required:true,
        default:false
    },
    skills:{type:[String],default:[]},
    expertise:{type:[String],default:[]},
    currentStatus:{
        type:String,
        enum:['Student','Working Professional',"Freelancer","Job Seeker",'other'],
        default:"Student"
    }
},{timestamps:true})

const UserModel = mongoose.model<IUser>('User',userSchema)
export default UserModel