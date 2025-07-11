import { IStudentProfileRepository } from "../interfaces/IStudentProfileRepository";

import UserModel,{IUser} from "../../models/userModel";
import { GenericRepository } from "../genericRepository";

export class studentProfileRepository extends GenericRepository<IUser> implements IStudentProfileRepository{
    constructor(){
        super(UserModel)
    }

    async getByEmail(email: string): Promise<IUser | null> {
        return await this.findOne({email})
    }

    async updateProfile(id: string, data: Partial<IUser>): Promise<IUser | null> {
        return await this.updateOne({_id:id},data)
    }

    async updatePassword(email: string, password: string): Promise<IUser | null> {
        return await this.updateOne({email},{password})
    }
}