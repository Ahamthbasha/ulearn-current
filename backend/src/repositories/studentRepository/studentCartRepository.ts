import { Types } from "mongoose";
import { ICart, CartModel } from "../../models/cartModel";
import { IStudentCartRepository } from "../interfaces/IStudentCartRepository";
import { GenericRepository } from "../genericRepository";

export class StudentCartRepository extends GenericRepository<ICart> implements IStudentCartRepository
{
  constructor() {
    super(CartModel);
  }

  async findCartByUserId(userId: Types.ObjectId): Promise<ICart | null> {
    const cart = await this.findOne({ userId });
    return cart ? await CartModel.populate(cart, { path: "courses" }) : null;
  }

  async addCourse(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<ICart> {
    let cart = await this.findOne({ userId });

    if (!cart) {
      cart = new CartModel({ userId, courses: [courseId] });
    } else {
      const alreadyExists = cart.courses.some(
        (c) => c.toString() === courseId.toString()
      );
      if (!alreadyExists) {
        cart.courses.push(courseId);
      }
    }

    return await cart.save();
  }

  async removeCourse(userId: Types.ObjectId, courseId: Types.ObjectId): Promise<ICart | null> {
    return await this.updateOneWithPopulate(
      { userId },
      { $pull: { courses: courseId } } as any,
      ["courses"]
    );
  }

  async clear(userId: Types.ObjectId): Promise<ICart | null> {
    return await this.updateOneWithPopulate(
      { userId },
      { $set: { courses: [] } } as any,
      ["courses"]
    );
  }
}
