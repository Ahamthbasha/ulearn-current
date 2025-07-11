import {Schema,model,Document,Types} from 'mongoose'

export interface ICategoryModel extends Document{
    _id:Types.ObjectId;
    categoryName:string;
    isListed:boolean
}

const CategorySchema = new Schema<ICategoryModel>({
    categoryName:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

export  const CategoryModel = model<ICategoryModel>('Category',CategorySchema)