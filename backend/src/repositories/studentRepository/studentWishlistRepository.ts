import { IStudentWishlistRepository } from "./interface/IStudentWishlistRepository";
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

  async addToWishlist(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<IWishlist> {
    return await this.create({ userId, courseId });
  }

  async removeFromWishlist(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<void> {
    await this.findOneAndDelete({ userId, courseId });
  }

  async getWishlistCourses(userId: Types.ObjectId): Promise<IWishlist[]> {
    return (await this.findAll({ userId }, [
      { path: "courseId" },
    ])) as IWishlist[];
  }

  async isCourseInWishlist(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<boolean> {
    const result = await this.findOne({ userId, courseId });
    return !!result;
  }
}
