import { Types } from "mongoose";
import { ICart, CartModel } from "../../models/cartModel";
import { IStudentCartRepository } from "../interfaces/IStudentCartRepository";
import { GenericRepository } from "../genericRepository";

export class StudentCartRepository
  extends GenericRepository<ICart>
  implements IStudentCartRepository
{
  constructor() {
    super(CartModel);
  }

  async findCartByUserId(userId: Types.ObjectId): Promise<ICart | null> {
    return await this.findOne({ userId }, [{ path: "courses" }]);
  }

  async addCourse(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<ICart> {
    let cart = await this.findOne({ userId });

    if (!cart) {
      // Create new cart using the model from GenericRepository
      const newCart = await this.create({ userId, courses: [courseId] } as Partial<ICart>);
      return newCart;
    } else {
      const alreadyExists = cart.courses.some(
        (c) => c.toString() === courseId.toString(),
      );
      if (!alreadyExists) {
        cart.courses.push(courseId);
        await cart.save();
      }
    }

    // Return the cart with populated courses
    const populatedCart = await this.findOne({ userId }, [{ path: "courses" }]);
    return populatedCart!;
  }

  async removeCourse(
    userId: Types.ObjectId,
    courseId: Types.ObjectId,
  ): Promise<ICart | null> {
    return await this.updateOneWithPopulate(
      { userId },
      { $pull: { courses: courseId } } as any,
      [{ path: "courses" }],
    );
  }

  async clear(userId: Types.ObjectId): Promise<ICart | null> {
    return await this.updateOneWithPopulate(
      { userId },
      { $set: { courses: [] } } as any,
      [{ path: "courses" }],
    );
  }
}