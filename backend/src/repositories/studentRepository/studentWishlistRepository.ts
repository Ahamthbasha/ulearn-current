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
    itemId: Types.ObjectId,
    type: "course" | "learningPath"
  ): Promise<IWishlist> {
    const query = type === "course" ? { courseId: itemId } : { learningPathId: itemId };
    return await this.create({ userId, ...query });
  }

  async removeFromWishlist(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    type: "course" | "learningPath"
  ): Promise<void> {
    const query = type === "course" ? { userId, courseId: itemId } : { userId, learningPathId: itemId };
    await this.findOneAndDelete(query);
  }

  async getWishlistItems(userId: Types.ObjectId): Promise<IWishlist[]> {
    return (await this.findAll({ userId }, [
      { path: "courseId" },
      { path: "learningPathId" },
    ])) as IWishlist[];
  }

  async isItemInWishlist(
    userId: Types.ObjectId,
    itemId: Types.ObjectId,
    type: "course" | "learningPath"
  ): Promise<boolean> {
    const query = type === "course" ? { userId, courseId: itemId } : { userId, learningPathId: itemId };
    const result = await this.findOne(query);
    return !!result;
  }
}