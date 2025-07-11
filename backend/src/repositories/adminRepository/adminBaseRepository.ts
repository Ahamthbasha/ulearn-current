import UserModel , {IUser} from "../../models/userModel";
import InstructorModel ,{IInstructor} from "../../models/instructorModel";
import { IAdminBaseRepository } from "../interfaces/IAdminBaseRepository";

export class AdminBaseRespository implements IAdminBaseRepository{

//fetch all users and instructors

async getAllUsers(page: number, limit: number, search: string): Promise<{ users: IUser[]; total: number }> {
  try {
    let query = {};

    if (search && search.trim() !== '') {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await UserModel.countDocuments(query);
    const users = await UserModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return { users, total };
  } catch (error) {
    throw error;
  }
}



async getAllInstructors(page: number, limit: number, search: string): Promise<{ instructors: IInstructor[]; total: number }> {
  try {
    const query = {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };

    const total = await InstructorModel.countDocuments(query);
    const instructors = await InstructorModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional sorting

    return { instructors, total };
  } catch (error) {
    throw error;
  }
}


 //get specified data based on email   

    async getUserData(email: string): Promise<IUser | null> {
        try {
            const userData = await UserModel.findOne({email:email})
    
            return userData
        } catch (error) {
            throw error
        }
    }

    async getInstructorData(email: string): Promise<IInstructor | null> {
        try {
            const instructorData = await InstructorModel.findOne({email:email})
            return instructorData
        } catch (error) {
            throw error
        }
    }

//block or unblock 

    async updateProfile(email: string, data: any): Promise<any> {
        try {
            const response = await UserModel.findOneAndUpdate(
                {email},
                {$set:data},
                {new:true}
            )

            return response
        } catch (error) {
            throw error
        }
    }

    async updateInstructorProfile(email: string, data: any): Promise<any> {
        try {
            const response = await InstructorModel.findOneAndUpdate(
                {email},
                {$set:data},
                {new:true}
            )

            return response
        } catch (error) {
            throw error
        }
    }
}