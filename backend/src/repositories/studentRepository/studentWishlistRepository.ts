import { IStudentWishlistRepository } from "../interfaces/IStudentWishlistRepository";
import { WishlistModel, IWishlist } from "../../models/wishlistModel";
import { Types } from "mongoose";
import { GenericRepository } from "../genericRepository";

export class StudentWishlistRepository
  extends GenericRepository<IWishlist>
  implements IStudentWishlistRepository
{
  constructor() {
    super(WishlistModel);
  }

  async addToWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<IWishlist> {
    return await this.create({ userId, courseId });
  }

  async removeFromWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<void> {
    await WishlistModel.findOneAndDelete({ userId, courseId });
  }

  async getWishlistCourses(userId: Types.ObjectId): Promise<IWishlist[]> {
    return await this.findAll(
      { userId },
      [{path:"courseId"}] // or use populate option array if needed
    ) as IWishlist[]; // type assertion
  }

  async isCourseInWishlist(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<boolean> {
    const result = await this.findOne({ userId, courseId });
    return !!result;
  }
}
