import { IUser } from "../../../models/userModel";
import {Types} from "mongoose"

export interface IAdminUserRepository {
  //get all data
  getAllUsers(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ users: IUser[]; total: number }>;

  //get data based on email
  getUserData(email: string): Promise<IUser | null>;

  //block and unblock
  updateProfile(email: string, data: Partial<IUser>): Promise<IUser|null>;

  //get by user id
  getUserById(userId:string|Types.ObjectId) : Promise<IUser | null>

  getUsersByIds(ids: (string | Types.ObjectId)[]): Promise<IUser[]>;
}