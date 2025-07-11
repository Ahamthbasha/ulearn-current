import { StudentErrorMessages } from "../../utils/constants";
import UserModel, { IUser, IUserDTO } from "../../models/userModel";
import { GenericRepository } from "../genericRepository";
import { IStudentRepository } from "../interfaces/IStudentRepository";
import bcrypt from 'bcryptjs'
import {Types} from "mongoose"
export class StudentRepository extends GenericRepository<IUser> implements IStudentRepository {
    constructor() {
        super(UserModel); // parent class is generic repository.We call parent class constructor and give model to work with
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await this.findOne({ email });
    }

    async createUser(userData:IUserDTO):Promise<IUser | null>{
        return await this.create(userData)
    }

    async resetPasswrod(email: string, password: string): Promise<IUser | null> {
        try {
            const student = await this.findOne({email})

            if(!student){
                throw new Error(StudentErrorMessages.USER_NOT_FOUND)
            }

            const studentId = student._id as unknown as string

            const response = await this.update(studentId,{password})

            return response
        } catch (error) {
            throw error
        }
    }

    async googleLogin(name: string, email: string): Promise<IUser | null> {
    const user = await this.findByEmail(email);
    const username = name;

    if (!user) {
        const tempPassword = Date.now().toString() + Math.floor(Math.random() * 10000).toString();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await this.createUser({
            username,
            email,
            password: hashedPassword,
            role: "student"
        });

        return newUser;
    }

    return user;
}

async findById(userId: string | Types.ObjectId): Promise<IUser | null> {
  return await super.findById(userId.toString());
}


}

