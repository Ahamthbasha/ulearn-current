import UserModel, { IUser } from "../../models/userModel";
import { GenericRepository } from "../genericRepository";
import { IAdminUserRepository } from "./interface/IAdminUserRepository";

export class AdmiUserRespository
  extends GenericRepository<IUser>
  implements IAdminUserRepository
{
  constructor() {
    super(UserModel);
  }

  async getAllUsers(
    page: number,
    limit: number,
    search: string,
  ): Promise<{ users: IUser[]; total: number }> {
    try {
      let query = {};

      if (search && search.trim() !== "") {
        query = {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        };
      }

      // Use the built-in paginate method from GenericRepository
      const result = await this.paginate(
        query,
        page,
        limit,
        { createdAt: -1 }, // sort by createdAt descending
      );

      return {
        users: result.data,
        total: result.total,
      };
    } catch (error) {
      throw error;
    }
  }

  //get specified data based on email

  async getUserData(email: string): Promise<IUser | null> {
    try {
      const userData = await this.findOne({ email: email });

      return userData;
    } catch (error) {
      throw error;
    }
  }

  //block or unblock

  async updateProfile(email: string, data: any): Promise<any> {
    try {
      const response = await this.findOneAndUpdate(
        { email },
        { $set: data },
        { new: true },
      );

      return response;
    } catch (error) {
      throw error;
    }
  }
}
