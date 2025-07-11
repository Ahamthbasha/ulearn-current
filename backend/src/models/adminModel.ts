import mongoose,{Schema,Document} from "mongoose";
import { Types } from "mongoose";

export interface IAdminDTO{
    email:string,
    password:string
}

export interface IAdmin extends Document{
    _id:Types.ObjectId,
    email:string,
    password:string,
    role:string,
    profilePicUrl?:string,
}

const adminSchema : Schema<IAdmin> = new Schema({
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
        required:false,
        default:"admin"
    },
    profilePicUrl:{
        type:String,
        required:false
    }
},{timestamps:true})

const AdminModel = mongoose.model<IAdmin>("Admin",adminSchema)
export default AdminModel